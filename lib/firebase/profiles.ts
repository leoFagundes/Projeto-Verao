import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import type { BodyMeasurement } from "@/types/measurement";
import type { Profile, ProfileInput } from "@/types/profile";

import { db } from "./client";
import { deleteImageIfOwned, deleteImagesIfOwned } from "./storage";

function requireDb() {
  if (!db) {
    throw new Error(
      "Firebase não está configurado. Configure as variáveis de ambiente para continuar.",
    );
  }
  return db;
}

function profilesRef() {
  return collection(requireDb(), "profiles");
}

export function subscribeProfiles(
  onData: (profiles: Profile[]) => void,
  onError?: (error: Error) => void,
) {
  if (!db) return () => {};

  const q = query(profilesRef(), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Profile, "id">),
        })),
      );
    },
    (error) => onError?.(error),
  );
}

export async function createProfile(input: ProfileInput) {
  const docRef = await addDoc(profilesRef(), {
    ...input,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function updateProfile(
  id: string,
  input: Partial<ProfileInput>,
  previousPhotoUrl?: string | null,
) {
  await updateDoc(doc(requireDb(), "profiles", id), input);

  if ("photoUrl" in input && input.photoUrl !== previousPhotoUrl) {
    await deleteImageIfOwned(previousPhotoUrl);
  }
}

export async function deleteProfile(profile: Profile) {
  const database = requireDb();
  const id = profile.id;

  const measurementsSnapshot = await getDocs(collection(database, "profiles", id, "measurements"));
  const measurementPhotos = measurementsSnapshot.docs.flatMap((docSnap) => {
    const data = docSnap.data() as Partial<BodyMeasurement> & { photoUrl?: string | null };
    return data.photos ?? (data.photoUrl ? [data.photoUrl] : []);
  });

  const subcollections = ["workouts", "sessions", "runs", "measurements"];
  await Promise.all(
    subcollections.map(async (name) => {
      const snapshot = await getDocs(collection(database, "profiles", id, name));
      await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
    }),
  );

  await deleteDoc(doc(database, "profiles", id));

  await deleteImagesIfOwned([profile.photoUrl, ...measurementPhotos]);
}

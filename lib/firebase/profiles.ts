import {
  addDoc,
  arrayRemove,
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
import type { WorkoutLinkRef } from "@/types/workout";

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
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<Profile, "id" | "password" | "allowSharedWorkouts" | "linkedAuth"> & {
            password?: string | null;
            allowSharedWorkouts?: boolean;
            linkedAuth?: Profile["linkedAuth"];
          };
          return {
            id: docSnap.id,
            ...data,
            password: data.password ?? null,
            allowSharedWorkouts: data.allowSharedWorkouts ?? false,
            linkedAuth: data.linkedAuth ?? null,
          };
        }),
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

export async function setProfileLinkedAuth(id: string, linkedAuth: Profile["linkedAuth"]) {
  await updateDoc(doc(requireDb(), "profiles", id), { linkedAuth });
}

export async function deleteProfile(profile: Profile) {
  const database = requireDb();
  const id = profile.id;

  const [measurementsSnapshot, workoutsSnapshot] = await Promise.all([
    getDocs(collection(database, "profiles", id, "measurements")),
    getDocs(collection(database, "profiles", id, "workouts")),
  ]);
  const measurementPhotos = measurementsSnapshot.docs.flatMap((docSnap) => {
    const data = docSnap.data() as Partial<BodyMeasurement> & { photoUrl?: string | null };
    return data.photos ?? (data.photoUrl ? [data.photoUrl] : []);
  });

  // Every workout this profile owns is about to be deleted. Any that were
  // linked to other profiles' workouts would otherwise leave those profiles
  // pointing at a doc that no longer exists — clean up their side first,
  // same as deleting a single linked workout already does.
  await Promise.all(
    workoutsSnapshot.docs.map(async (docSnap) => {
      const linkedWorkouts = (docSnap.data().linkedWorkouts ?? []) as WorkoutLinkRef[];
      if (linkedWorkouts.length === 0) return;
      const myRef: WorkoutLinkRef = { profileId: id, workoutId: docSnap.id };
      await Promise.all(
        linkedWorkouts.map((ref) =>
          updateDoc(doc(database, "profiles", ref.profileId, "workouts", ref.workoutId), {
            linkedWorkouts: arrayRemove(myRef),
          }).catch(() => {}),
        ),
      );
    }),
  );

  const subcollections: Array<{ name: string; snapshot?: Awaited<ReturnType<typeof getDocs>> }> = [
    { name: "workouts", snapshot: workoutsSnapshot },
    { name: "sessions" },
    { name: "runs" },
    { name: "measurements", snapshot: measurementsSnapshot },
    { name: "goals" },
    { name: "activeSessions" },
    { name: "diets" },
    { name: "dietHistory" },
  ];
  await Promise.all(
    subcollections.map(async ({ name, snapshot }) => {
      const docs = snapshot ?? (await getDocs(collection(database, "profiles", id, name)));
      await Promise.all(docs.docs.map((docSnap) => deleteDoc(docSnap.ref)));
    }),
  );

  await deleteDoc(doc(database, "profiles", id));

  await deleteImagesIfOwned([profile.photoUrl, ...measurementPhotos]);
}

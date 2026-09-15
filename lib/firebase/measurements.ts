import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";

import type { BodyMeasurement, BodyMeasurementInput } from "@/types/measurement";

import { db } from "./client";
import { deleteImageIfOwned } from "./storage";

function requireDb() {
  if (!db) {
    throw new Error(
      "Firebase não está configurado. Configure as variáveis de ambiente para continuar.",
    );
  }
  return db;
}

function measurementsRef(profileId: string) {
  return collection(requireDb(), "profiles", profileId, "measurements");
}

export function subscribeMeasurements(
  profileId: string,
  onData: (measurements: BodyMeasurement[]) => void,
  onError?: (error: Error) => void,
) {
  if (!db) return () => {};

  const q = query(measurementsRef(profileId), orderBy("date", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<BodyMeasurement, "id">),
        })),
      );
    },
    (error) => onError?.(error),
  );
}

export async function createMeasurement(profileId: string, input: BodyMeasurementInput) {
  const docRef = await addDoc(measurementsRef(profileId), {
    ...input,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function updateMeasurement(
  profileId: string,
  measurementId: string,
  input: BodyMeasurementInput,
  previousPhotoUrl?: string | null,
) {
  await updateDoc(doc(requireDb(), "profiles", profileId, "measurements", measurementId), {
    ...input,
  });

  if (input.photoUrl !== previousPhotoUrl) {
    await deleteImageIfOwned(previousPhotoUrl);
  }
}

export async function deleteMeasurement(profileId: string, measurement: BodyMeasurement) {
  await deleteDoc(doc(requireDb(), "profiles", profileId, "measurements", measurement.id));
  await deleteImageIfOwned(measurement.photoUrl);
}

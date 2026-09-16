import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";

import type { MeasurementGoal, MeasurementGoalInput } from "@/types/measurement";

import { db } from "./client";

function requireDb() {
  if (!db) {
    throw new Error(
      "Firebase não está configurado. Configure as variáveis de ambiente para continuar.",
    );
  }
  return db;
}

function goalsRef(profileId: string) {
  return collection(requireDb(), "profiles", profileId, "goals");
}

/** One goal per field — the field key doubles as the doc id. */
function goalDoc(profileId: string, field: string) {
  return doc(requireDb(), "profiles", profileId, "goals", field);
}

export function subscribeGoals(
  profileId: string,
  onData: (goals: MeasurementGoal[]) => void,
  onError?: (error: Error) => void,
) {
  if (!db) return () => {};

  return onSnapshot(
    goalsRef(profileId),
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<MeasurementGoal, "id">),
        })),
      );
    },
    (error) => onError?.(error),
  );
}

export async function setGoal(profileId: string, input: MeasurementGoalInput) {
  await setDoc(goalDoc(profileId, input.field), { ...input, createdAt: Date.now() });
}

export async function deleteGoal(profileId: string, field: string) {
  await deleteDoc(goalDoc(profileId, field));
}

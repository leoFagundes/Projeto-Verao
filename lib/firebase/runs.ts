import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";

import type { Run, RunInput } from "@/types/run";

import { db } from "./client";

function requireDb() {
  if (!db) {
    throw new Error(
      "Firebase não está configurado. Configure as variáveis de ambiente para continuar.",
    );
  }
  return db;
}

function runsRef(profileId: string) {
  return collection(requireDb(), "profiles", profileId, "runs");
}

function computePace(input: RunInput) {
  if (input.distanceKm <= 0) return 0;
  return Math.round((input.durationMin * 60) / input.distanceKm);
}

export function subscribeRuns(
  profileId: string,
  onData: (runs: Run[]) => void,
  onError?: (error: Error) => void,
) {
  if (!db) return () => {};

  const q = query(runsRef(profileId), orderBy("date", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Run, "id">),
        })),
      );
    },
    (error) => onError?.(error),
  );
}

export async function createRun(profileId: string, input: RunInput) {
  const docRef = await addDoc(runsRef(profileId), {
    ...input,
    paceSecPerKm: computePace(input),
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function updateRun(profileId: string, runId: string, input: RunInput) {
  await updateDoc(doc(requireDb(), "profiles", profileId, "runs", runId), {
    ...input,
    paceSecPerKm: computePace(input),
  });
}

export async function deleteRun(profileId: string, runId: string) {
  await deleteDoc(doc(requireDb(), "profiles", profileId, "runs", runId));
}

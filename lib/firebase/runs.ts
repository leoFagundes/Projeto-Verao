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
  // Pace isn't a meaningful number for interval splits (rest between reps
  // skews it), so "tiro" runs simply don't carry one.
  if (input.type === "tiro") return 0;
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
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<Run, "id" | "repCount" | "repDistanceM" | "sharedByName"> & {
            repCount?: number | null;
            repDistanceM?: number | null;
            sharedByName?: string | null;
          };
          return {
            id: docSnap.id,
            ...data,
            repCount: data.repCount ?? null,
            repDistanceM: data.repDistanceM ?? null,
            sharedByName: data.sharedByName ?? null,
          };
        }),
      );
    },
    (error) => onError?.(error),
  );
}

export async function createRun(profileId: string, input: RunInput) {
  const docRef = await addDoc(runsRef(profileId), {
    ...input,
    sharedByName: input.sharedByName ?? null,
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

/** Clears the "someone shared this with you" notice once seen. */
export async function dismissRunShareNotice(profileId: string, runId: string) {
  await updateDoc(doc(requireDb(), "profiles", profileId, "runs", runId), {
    sharedByName: null,
  });
}

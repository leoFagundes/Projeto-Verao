import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";

import type { ActiveSession, ActiveSessionInput, SessionExerciseLog } from "@/types/session";

import { db } from "./client";

function requireDb() {
  if (!db) {
    throw new Error(
      "Firebase não está configurado. Configure as variáveis de ambiente para continuar.",
    );
  }
  return db;
}

function activeSessionsRef(profileId: string) {
  return collection(requireDb(), "profiles", profileId, "activeSessions");
}

/** One draft per workout — the workout's own id doubles as the draft's doc id. */
function activeSessionDoc(profileId: string, workoutId: string) {
  return doc(requireDb(), "profiles", profileId, "activeSessions", workoutId);
}

export function subscribeActiveSessions(
  profileId: string,
  onData: (sessions: ActiveSession[]) => void,
  onError?: (error: Error) => void,
) {
  if (!db) return () => {};

  const q = query(activeSessionsRef(profileId), orderBy("startedAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<ActiveSession, "id" | "exercises"> & {
            exercises: (Omit<SessionExerciseLog, "notes"> & { notes?: string })[];
          };
          return {
            id: docSnap.id,
            ...data,
            exercises: data.exercises.map((exercise) => ({ ...exercise, notes: exercise.notes ?? "" })),
          };
        }),
      );
    },
    (error) => onError?.(error),
  );
}

export async function saveActiveSession(profileId: string, input: ActiveSessionInput) {
  await setDoc(activeSessionDoc(profileId, input.workoutId), {
    ...input,
    updatedAt: Date.now(),
  });
}

export async function deleteActiveSession(profileId: string, workoutId: string) {
  await deleteDoc(activeSessionDoc(profileId, workoutId));
}

import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";

import type { WorkoutSession, WorkoutSessionInput } from "@/types/session";

import { db } from "./client";
import { touchWorkoutPerformed } from "./workouts";

function requireDb() {
  if (!db) {
    throw new Error(
      "Firebase não está configurado. Configure as variáveis de ambiente para continuar.",
    );
  }
  return db;
}

function sessionsRef(profileId: string) {
  return collection(requireDb(), "profiles", profileId, "sessions");
}

export function subscribeSessions(
  profileId: string,
  onData: (sessions: WorkoutSession[]) => void,
  onError?: (error: Error) => void,
) {
  if (!db) return () => {};

  const q = query(sessionsRef(profileId), orderBy("date", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<WorkoutSession, "id">),
        })),
      );
    },
    (error) => onError?.(error),
  );
}

export async function createSession(profileId: string, input: WorkoutSessionInput) {
  const docRef = await addDoc(sessionsRef(profileId), {
    ...input,
    createdAt: Date.now(),
  });

  if (input.workoutId) {
    await touchWorkoutPerformed(profileId, input.workoutId);
  }

  return docRef.id;
}

export async function deleteSession(profileId: string, sessionId: string) {
  await deleteDoc(doc(requireDb(), "profiles", profileId, "sessions", sessionId));
}

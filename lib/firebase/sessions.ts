import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";

import type { SessionExerciseLog, SetLog, WorkoutSession, WorkoutSessionInput } from "@/types/session";

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
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<WorkoutSession, "id" | "exercises" | "sharedByName"> & {
            exercises: (Omit<SessionExerciseLog, "notes" | "sets"> & {
              notes?: string;
              sets: (Omit<SetLog, "durationSeconds"> & { durationSeconds?: number | null })[];
            })[];
            sharedByName?: string | null;
          };
          return {
            id: docSnap.id,
            ...data,
            exercises: data.exercises.map((exercise) => ({
              ...exercise,
              notes: exercise.notes ?? "",
              sets: exercise.sets.map((set) => ({ ...set, durationSeconds: set.durationSeconds ?? null })),
            })),
            sharedByName: data.sharedByName ?? null,
          };
        }),
      );
    },
    (error) => onError?.(error),
  );
}

export async function createSession(profileId: string, input: WorkoutSessionInput) {
  const docRef = await addDoc(sessionsRef(profileId), {
    ...input,
    sharedByName: input.sharedByName ?? null,
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

/** Clears the "someone shared this with you" notice once seen. */
export async function dismissSessionShareNotice(profileId: string, sessionId: string) {
  await updateDoc(doc(requireDb(), "profiles", profileId, "sessions", sessionId), {
    sharedByName: null,
  });
}

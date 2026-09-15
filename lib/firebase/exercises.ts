import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";

import type { ExerciseDef, ExerciseDefInput } from "@/types/exercise";

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

function exercisesRef() {
  return collection(requireDb(), "exercises");
}

export function subscribeExercises(
  onData: (exercises: ExerciseDef[]) => void,
  onError?: (error: Error) => void,
) {
  if (!db) return () => {};

  const q = query(exercisesRef(), orderBy("name", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<ExerciseDef, "id">),
        })),
      );
    },
    (error) => onError?.(error),
  );
}

export async function createExerciseDef(input: ExerciseDefInput) {
  const docRef = await addDoc(exercisesRef(), {
    ...input,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function updateExerciseDef(
  id: string,
  input: ExerciseDefInput,
  previousImageUrl?: string | null,
) {
  await updateDoc(doc(requireDb(), "exercises", id), { ...input });

  if (input.imageUrl !== previousImageUrl) {
    await deleteImageIfOwned(previousImageUrl);
  }
}

export async function deleteExerciseDef(exercise: ExerciseDef) {
  await deleteDoc(doc(requireDb(), "exercises", exercise.id));
  await deleteImageIfOwned(exercise.imageUrl);
}

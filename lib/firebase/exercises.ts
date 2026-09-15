import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";

import type { ExerciseDef, ExerciseDefInput } from "@/types/exercise";

import { db } from "./client";
import { deleteImagesIfOwned } from "./storage";

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

/** Reads pre-multi-image docs (`imageUrl`) as a one-item `images` array. */
function normalizeExerciseDef(id: string, data: Record<string, unknown>): ExerciseDef {
  const legacyImageUrl = data.imageUrl as string | null | undefined;
  return {
    id,
    name: data.name as string,
    muscleGroup: (data.muscleGroup as ExerciseDef["muscleGroup"]) ?? null,
    images: (data.images as string[] | undefined) ?? (legacyImageUrl ? [legacyImageUrl] : []),
    videoUrl: (data.videoUrl as string | null | undefined) ?? null,
    notes: (data.notes as string) ?? "",
    createdAt: data.createdAt as number,
  };
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
      onData(snapshot.docs.map((docSnap) => normalizeExerciseDef(docSnap.id, docSnap.data())));
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
  previousImages: string[] = [],
) {
  await updateDoc(doc(requireDb(), "exercises", id), { ...input });

  const removed = previousImages.filter((url) => !input.images.includes(url));
  await deleteImagesIfOwned(removed);
}

export async function deleteExerciseDef(exercise: ExerciseDef) {
  await deleteDoc(doc(requireDb(), "exercises", exercise.id));
  await deleteImagesIfOwned(exercise.images);
}

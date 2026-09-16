import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { generateId } from "@/lib/utils";
import type { Exercise, Workout, WorkoutInput } from "@/types/workout";

import { db } from "./client";

function requireDb() {
  if (!db) {
    throw new Error(
      "Firebase não está configurado. Configure as variáveis de ambiente para continuar.",
    );
  }
  return db;
}

function workoutsRef(profileId: string) {
  return collection(requireDb(), "profiles", profileId, "workouts");
}

/** Reads pre-multi-image exercise entries (`imageUrl`) as a one-item `images` array. */
function normalizeStoredExercise(exercise: Record<string, unknown>): Exercise {
  const legacyImageUrl = exercise.imageUrl as string | null | undefined;
  return {
    id: exercise.id as string,
    exerciseId: exercise.exerciseId as string,
    name: exercise.name as string,
    sets: exercise.sets as number,
    reps: exercise.reps as string,
    weight: (exercise.weight as number | null) ?? null,
    restSeconds: (exercise.restSeconds as number | null) ?? null,
    muscleGroup: (exercise.muscleGroup as Exercise["muscleGroup"]) ?? null,
    images: (exercise.images as string[] | undefined) ?? (legacyImageUrl ? [legacyImageUrl] : []),
    videoUrl: (exercise.videoUrl as string | null | undefined) ?? null,
    notes: (exercise.notes as string) ?? "",
    hidden: (exercise.hidden as boolean) ?? false,
    linkedToNext: (exercise.linkedToNext as boolean) ?? false,
  };
}

export function subscribeWorkouts(
  profileId: string,
  onData: (workouts: Workout[]) => void,
  onError?: (error: Error) => void,
) {
  if (!db) return () => {};

  const q = query(workoutsRef(profileId), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<Workout, "id" | "exercises"> & {
            exercises: Record<string, unknown>[];
          };
          return {
            id: docSnap.id,
            ...data,
            category: data.category ?? null,
            exercises: data.exercises.map(normalizeStoredExercise),
          };
        }),
      );
    },
    (error) => onError?.(error),
  );
}

function normalizeExercises(exercises: WorkoutInput["exercises"]) {
  return exercises.map((exercise) => ({
    ...exercise,
    id: exercise.id ?? generateId(),
    hidden: exercise.hidden ?? false,
    images: exercise.images ?? [],
    videoUrl: exercise.videoUrl ?? null,
    linkedToNext: exercise.linkedToNext ?? false,
  }));
}

export async function createWorkout(profileId: string, input: WorkoutInput) {
  const now = Date.now();
  const docRef = await addDoc(workoutsRef(profileId), {
    name: input.name,
    category: input.category,
    exercises: normalizeExercises(input.exercises),
    createdAt: now,
    updatedAt: now,
    lastPerformedAt: null,
  });
  return docRef.id;
}

export async function updateWorkout(
  profileId: string,
  workoutId: string,
  input: WorkoutInput,
) {
  await updateDoc(doc(requireDb(), "profiles", profileId, "workouts", workoutId), {
    name: input.name,
    category: input.category,
    exercises: normalizeExercises(input.exercises),
    updatedAt: Date.now(),
  });
}

export async function touchWorkoutPerformed(profileId: string, workoutId: string) {
  await updateDoc(doc(requireDb(), "profiles", profileId, "workouts", workoutId), {
    lastPerformedAt: Date.now(),
  });
}

export async function setExerciseHidden(
  profileId: string,
  workoutId: string,
  workout: Workout,
  exerciseId: string,
  hidden: boolean,
) {
  const exercises = workout.exercises.map((exercise) =>
    exercise.id === exerciseId ? { ...exercise, hidden } : exercise,
  );
  await updateDoc(doc(requireDb(), "profiles", profileId, "workouts", workoutId), {
    exercises,
    updatedAt: Date.now(),
  });
}

export async function copyWorkout(
  sourceProfileId: string,
  targetProfileId: string,
  workout: Workout,
) {
  const sameProfile = sourceProfileId === targetProfileId;
  return createWorkout(targetProfileId, {
    name: sameProfile ? `${workout.name} (cópia)` : workout.name,
    category: workout.category,
    exercises: workout.exercises,
  });
}

export async function deleteWorkout(profileId: string, workoutId: string) {
  await deleteDoc(doc(requireDb(), "profiles", profileId, "workouts", workoutId));
}

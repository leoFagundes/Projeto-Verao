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
import type { Workout, WorkoutInput } from "@/types/workout";

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
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Workout, "id">),
        })),
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
  }));
}

export async function createWorkout(profileId: string, input: WorkoutInput) {
  const now = Date.now();
  const docRef = await addDoc(workoutsRef(profileId), {
    name: input.name,
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
    exercises: workout.exercises,
  });
}

export async function deleteWorkout(profileId: string, workoutId: string) {
  await deleteDoc(doc(requireDb(), "profiles", profileId, "workouts", workoutId));
}

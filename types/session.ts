import type { MuscleGroup } from "./workout";

export type SetLog = {
  reps: string;
  weight: number | null;
  done: boolean;
};

export type SessionExerciseLog = {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup | null;
  sets: SetLog[];
};

export type WorkoutSession = {
  id: string;
  workoutId: string | null;
  workoutName: string;
  date: number;
  durationMin: number;
  note: string;
  exercises: SessionExerciseLog[];
  createdAt: number;
};

export type WorkoutSessionInput = {
  workoutId: string | null;
  workoutName: string;
  date: number;
  durationMin: number;
  note: string;
  exercises: SessionExerciseLog[];
};

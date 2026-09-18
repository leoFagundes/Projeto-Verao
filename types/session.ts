import type { MuscleGroup } from "./workout";

export type SetLog = {
  reps: string;
  weight: number | null;
  /** Seconds actually held/logged for this set — only used for time-based exercises. */
  durationSeconds: number | null;
  done: boolean;
};

export type SessionExerciseLog = {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup | null;
  sets: SetLog[];
  notes: string;
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
  /** Name of the profile that logged this FOR this one, via "share this
   * workout" at completion — null for a profile's own entries. Shown once as
   * a notice, then cleared the same way a linked-workout change note is. */
  sharedByName: string | null;
};

export type WorkoutSessionInput = {
  workoutId: string | null;
  workoutName: string;
  date: number;
  durationMin: number;
  note: string;
  exercises: SessionExerciseLog[];
  sharedByName?: string | null;
};

/** A workout in progress — saved as you go so closing the modal never loses it. */
export type ActiveSession = {
  id: string;
  workoutId: string;
  workoutName: string;
  date: number;
  durationMin: number;
  note: string;
  exercises: SessionExerciseLog[];
  startedAt: number;
  updatedAt: number;
};

export type ActiveSessionInput = {
  workoutId: string;
  workoutName: string;
  date: number;
  durationMin: number;
  note: string;
  exercises: SessionExerciseLog[];
  startedAt: number;
};

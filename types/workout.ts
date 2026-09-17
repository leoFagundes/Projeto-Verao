export const MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Ombro",
  "Bíceps",
  "Tríceps",
  "Pernas",
  "Glúteos",
  "Core",
  "Cardio",
  "Outro",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MEASURE_TYPES = ["reps", "time"] as const;
export type MeasureType = (typeof MEASURE_TYPES)[number];

export type Exercise = {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  /** Target duration (seconds) per set — only meaningful when `measureType` is "time". */
  durationSeconds: number | null;
  /** Whether this exercise is tracked by reps or by a timed hold/interval. */
  measureType: MeasureType;
  /** Whether load tracking applies to this exercise at all (off for things like planks). Defaults to true. */
  trackWeight: boolean;
  weight: number | null;
  restSeconds: number | null;
  muscleGroup: MuscleGroup | null;
  images: string[];
  videoUrl: string | null;
  notes: string;
  hidden: boolean;
  /** True when this exercise and the next one are performed back-to-back as a superset/circuit, no rest between them. */
  linkedToNext: boolean;
};

export type ExerciseInput = Omit<Exercise, "id"> & { id?: string };

/** Points at one other profile's copy of a linked workout. */
export type WorkoutLinkRef = { profileId: string; workoutId: string };

/** Left on a profile's own copy when a linked edit from someone else lands on
 * it, so they get a heads-up next time they open it instead of a silent
 * change. Cleared once they dismiss/acknowledge it. */
export type WorkoutChangeNote = {
  changedByProfileId: string;
  changedByName: string;
  changedAt: number;
  addedNames: string[];
  removedNames: string[];
  renamed: boolean;
  syncedFieldLabels: string[];
};

export type Workout = {
  id: string;
  name: string;
  /** Used only to pick which icon represents the workout — no other effect. */
  category: MuscleGroup | null;
  exercises: Exercise[];
  createdAt: number;
  updatedAt: number;
  lastPerformedAt: number | null;
  /** Other profiles' copies of this same workout — editing here can optionally propagate to all of them. */
  linkedWorkouts: WorkoutLinkRef[];
  pendingChangeNote: WorkoutChangeNote | null;
};

export type WorkoutInput = {
  name: string;
  category: MuscleGroup | null;
  exercises: ExerciseInput[];
};

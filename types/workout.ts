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

export type Exercise = {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
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

export type Workout = {
  id: string;
  name: string;
  /** Used only to pick which icon represents the workout — no other effect. */
  category: MuscleGroup | null;
  exercises: Exercise[];
  createdAt: number;
  updatedAt: number;
  lastPerformedAt: number | null;
};

export type WorkoutInput = {
  name: string;
  category: MuscleGroup | null;
  exercises: ExerciseInput[];
};

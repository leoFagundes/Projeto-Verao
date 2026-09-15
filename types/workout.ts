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
  imageUrl: string | null;
  notes: string;
  hidden: boolean;
};

export type ExerciseInput = Omit<Exercise, "id"> & { id?: string };

export type Workout = {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt: number;
  updatedAt: number;
  lastPerformedAt: number | null;
};

export type WorkoutInput = {
  name: string;
  exercises: ExerciseInput[];
};

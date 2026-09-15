import type { MuscleGroup } from "./workout";

export type ExerciseDef = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup | null;
  imageUrl: string | null;
  notes: string;
  createdAt: number;
};

export type ExerciseDefInput = {
  name: string;
  muscleGroup: MuscleGroup | null;
  imageUrl: string | null;
  notes: string;
};

import type { MuscleGroup } from "@/types/workout";

// Dark-mode categorical steps (fixed order — identity, never re-assigned by rank).
export const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  Peito: "#3987e5",
  Costas: "#d95926",
  Ombro: "#199e70",
  Bíceps: "#c98500",
  Tríceps: "#d55181",
  Pernas: "#008300",
  Glúteos: "#9085e9",
  Core: "#e66767",
  Cardio: "#60a5fa",
  Outro: "#898781",
};

export const CHART_MUTED = "#898781";
export const CHART_GRID = "#2c2c2a";

export const RUN_TYPES = [
  { key: "normal", label: "Corrida normal", icon: "🏃" },
  { key: "tiro", label: "Tiro", icon: "⚡" },
  { key: "longao", label: "Longão", icon: "🛣️" },
] as const;

export type RunType = (typeof RUN_TYPES)[number]["key"];

export type Run = {
  id: string;
  date: number;
  type: RunType;
  distanceKm: number;
  durationMin: number;
  paceSecPerKm: number;
  note: string;
  createdAt: number;
};

export type RunInput = {
  date: number;
  type: RunType;
  distanceKm: number;
  durationMin: number;
  note: string;
};

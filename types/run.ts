import { Zap } from "lucide-react";
import { FaRunning } from "react-icons/fa";

export const RUN_TYPES = [
  { key: "normal", label: "Corrida normal", icon: FaRunning },
  { key: "tiro", label: "Tiro", icon: Zap },
] as const;

export type RunType = (typeof RUN_TYPES)[number]["key"];

export type Run = {
  id: string;
  date: number;
  type: RunType;
  distanceKm: number;
  durationMin: number;
  /** Not meaningful for "tiro" (interval splits) — stored as 0 there. */
  paceSecPerKm: number;
  /** "tiro" only: e.g. 10 reps of 200m. Null for "normal". */
  repCount: number | null;
  repDistanceM: number | null;
  note: string;
  createdAt: number;
};

export type RunInput = {
  date: number;
  type: RunType;
  distanceKm: number;
  durationMin: number;
  repCount: number | null;
  repDistanceM: number | null;
  note: string;
};

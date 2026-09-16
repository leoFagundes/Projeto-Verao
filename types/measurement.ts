export type BodyMeasurement = {
  id: string;
  date: number;
  weightKg: number | null;
  heightCm: number | null;
  bodyFatPct: number | null;
  muscleMassPct: number | null;
  waterPct: number | null;
  boneMassKg: number | null;
  visceralFat: number | null;
  bmrKcal: number | null;
  photos: string[];
  note: string;
  createdAt: number;
};

export type BodyMeasurementInput = {
  date: number;
  weightKg: number | null;
  heightCm: number | null;
  bodyFatPct: number | null;
  muscleMassPct: number | null;
  waterPct: number | null;
  boneMassKg: number | null;
  visceralFat: number | null;
  bmrKcal: number | null;
  photos: string[];
  note: string;
};

export const MEASUREMENT_FIELDS = [
  { key: "weightKg", label: "Peso", unit: "kg" },
  { key: "bodyFatPct", label: "Gordura corporal", unit: "%" },
  { key: "muscleMassPct", label: "Massa muscular", unit: "%" },
  { key: "waterPct", label: "Água corporal", unit: "%" },
  { key: "boneMassKg", label: "Massa óssea", unit: "kg" },
  { key: "visceralFat", label: "Gordura visceral", unit: "" },
  { key: "bmrKcal", label: "Metabolismo basal", unit: "kcal" },
] as const satisfies readonly { key: keyof BodyMeasurementInput; label: string; unit: string }[];

export type MeasurementFieldKey = (typeof MEASUREMENT_FIELDS)[number]["key"];

/** One active goal per field — direction (grow/shrink) is inferred from target vs. start. */
export type MeasurementGoal = {
  id: string;
  field: MeasurementFieldKey;
  targetValue: number;
  startValue: number;
  createdAt: number;
};

export type MeasurementGoalInput = {
  field: MeasurementFieldKey;
  targetValue: number;
  startValue: number;
};

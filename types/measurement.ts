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
  photoUrl: string | null;
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
  photoUrl: string | null;
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

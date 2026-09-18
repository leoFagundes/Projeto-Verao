export const WEEKDAYS = [
  { key: "seg", label: "Segunda-feira", short: "Seg" },
  { key: "ter", label: "Terça-feira", short: "Ter" },
  { key: "qua", label: "Quarta-feira", short: "Qua" },
  { key: "qui", label: "Quinta-feira", short: "Qui" },
  { key: "sex", label: "Sexta-feira", short: "Sex" },
  { key: "sab", label: "Sábado", short: "Sáb" },
  { key: "dom", label: "Domingo", short: "Dom" },
] as const;

export type WeekdayKey = (typeof WEEKDAYS)[number]["key"];

/** JS `Date.getDay()` (0 = Sunday) mapped to our Monday-first weekday keys. */
const JS_DAY_TO_KEY: WeekdayKey[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

export function todayWeekdayKey(): WeekdayKey {
  return JS_DAY_TO_KEY[new Date().getDay()];
}

export type DietMeal = {
  id: string;
  /** Free-form, e.g. "07:30" — not a strict time input so "ao acordar" etc. still fits. */
  time: string;
  /** Interchangeable choices for this meal slot — usually just one, but can
   * be several (e.g. "Shake" or "Pão com ovo"), always at least one entry. */
  options: string[];
};

export type DietDayPlan = {
  day: WeekdayKey;
  meals: DietMeal[];
};

export type DietMealCheck = {
  done: boolean;
  note: string;
  /** Which of the meal's `options` was actually eaten — index into that
   * array, or null when the meal only has one option (nothing to pick) or
   * hasn't been marked done yet. */
  optionIndex: number | null;
};

/** Keyed by `${day}:${mealId}`. */
export type DietProgress = Record<string, DietMealCheck>;

export type DietOffTrackNote = {
  off: boolean;
  note: string;
};

/** Keyed by weekday. */
export type DietOffTrack = Record<string, DietOffTrackNote>;

export type Diet = {
  id: string;
  name: string;
  days: DietDayPlan[];
  /** Only one diet per profile can be active at a time. */
  active: boolean;
  /** When the current tracking cycle (this week's checklist) began — null if never activated. */
  cycleStartedAt: number | null;
  progress: DietProgress;
  offTrack: DietOffTrack;
  createdAt: number;
  updatedAt: number;
  /** Name of the profile that created this FOR this one, via "share this
   * diet" at creation — null for a profile's own diets. Shown once as a
   * notice, then cleared once dismissed. */
  sharedByName: string | null;
};

export type DietInput = {
  name: string;
  days: DietDayPlan[];
  sharedByName?: string | null;
};

/** A past cycle, archived when a diet is restarted or ended. */
export type DietHistoryEntry = {
  id: string;
  dietId: string;
  dietName: string;
  days: DietDayPlan[];
  progress: DietProgress;
  offTrack: DietOffTrack;
  cycleStartedAt: number;
  endedAt: number;
  createdAt: number;
};

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { generateId } from "@/lib/utils";
import type {
  Diet,
  DietDayPlan,
  DietHistoryEntry,
  DietInput,
  DietMeal,
  DietMealCheck,
  DietOffTrackNote,
  DietProgress,
  WeekdayKey,
} from "@/types/diet";

import { db } from "./client";

function requireDb() {
  if (!db) {
    throw new Error(
      "Firebase não está configurado. Configure as variáveis de ambiente para continuar.",
    );
  }
  return db;
}

function dietsRef(profileId: string) {
  return collection(requireDb(), "profiles", profileId, "diets");
}

function dietHistoryRef(profileId: string) {
  return collection(requireDb(), "profiles", profileId, "dietHistory");
}

function normalizeDays(days: DietInput["days"]) {
  return days.map((day) => ({
    ...day,
    meals: day.meals.map((meal) => ({ ...meal, id: meal.id || generateId() })),
  }));
}

/** Reads a meal that may still be in the pre-variants shape (a single
 * `description` string) as the current `options` array shape. */
function normalizeReadMeal(meal: Record<string, unknown>): DietMeal {
  const options = Array.isArray(meal.options)
    ? (meal.options as string[])
    : typeof meal.description === "string"
      ? [meal.description]
      : [""];
  return { id: meal.id as string, time: meal.time as string, options };
}

function normalizeReadDays(days: Array<{ day: DietDayPlan["day"]; meals: Record<string, unknown>[] }>): DietDayPlan[] {
  return days.map((day) => ({ ...day, meals: day.meals.map(normalizeReadMeal) }));
}

function normalizeReadProgress(progress: Record<string, Partial<DietMealCheck>> | undefined): DietProgress {
  const result: DietProgress = {};
  for (const [key, check] of Object.entries(progress ?? {})) {
    result[key] = {
      done: check.done ?? false,
      note: check.note ?? "",
      optionIndex: check.optionIndex ?? null,
    };
  }
  return result;
}

export function subscribeDiets(
  profileId: string,
  onData: (diets: Diet[]) => void,
  onError?: (error: Error) => void,
) {
  if (!db) return () => {};

  const q = query(dietsRef(profileId), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<Diet, "id">;
          return {
            id: docSnap.id,
            ...data,
            days: normalizeReadDays(data.days),
            active: data.active ?? false,
            cycleStartedAt: data.cycleStartedAt ?? null,
            progress: normalizeReadProgress(data.progress),
            offTrack: data.offTrack ?? {},
            sharedByName: data.sharedByName ?? null,
          };
        }),
      );
    },
    (error) => onError?.(error),
  );
}

export function subscribeDietHistory(
  profileId: string,
  onData: (entries: DietHistoryEntry[]) => void,
  onError?: (error: Error) => void,
) {
  if (!db) return () => {};

  const q = query(dietHistoryRef(profileId), orderBy("endedAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<DietHistoryEntry, "id">;
          return {
            id: docSnap.id,
            ...data,
            days: normalizeReadDays(data.days),
            progress: normalizeReadProgress(data.progress),
          };
        }),
      );
    },
    (error) => onError?.(error),
  );
}

export async function createDiet(profileId: string, input: DietInput) {
  const now = Date.now();
  await addDoc(dietsRef(profileId), {
    name: input.name,
    days: normalizeDays(input.days),
    active: false,
    cycleStartedAt: null,
    progress: {},
    offTrack: {},
    createdAt: now,
    updatedAt: now,
    sharedByName: input.sharedByName ?? null,
  });
}

/** Clears the "someone shared this with you" notice once seen. */
export async function dismissDietShareNotice(profileId: string, dietId: string) {
  await updateDoc(doc(requireDb(), "profiles", profileId, "diets", dietId), {
    sharedByName: null,
  });
}

export async function updateDiet(profileId: string, dietId: string, input: DietInput) {
  await updateDoc(doc(requireDb(), "profiles", profileId, "diets", dietId), {
    name: input.name,
    days: normalizeDays(input.days),
    updatedAt: Date.now(),
  });
}

export async function deleteDiet(profileId: string, dietId: string) {
  await deleteDoc(doc(requireDb(), "profiles", profileId, "diets", dietId));
}

/** Makes this diet the active one (deactivating whichever was), starting a fresh tracking cycle. */
export async function activateDiet(profileId: string, dietId: string, allDiets: Diet[]) {
  const database = requireDb();
  const batch = writeBatch(database);
  for (const diet of allDiets) {
    if (diet.id === dietId) {
      batch.update(doc(database, "profiles", profileId, "diets", diet.id), {
        active: true,
        cycleStartedAt: Date.now(),
        progress: {},
        offTrack: {},
      });
    } else if (diet.active) {
      batch.update(doc(database, "profiles", profileId, "diets", diet.id), { active: false });
    }
  }
  await batch.commit();
}

export async function setMealCheck(profileId: string, dietId: string, key: string, check: DietMealCheck) {
  await updateDoc(doc(requireDb(), "profiles", profileId, "diets", dietId), {
    [`progress.${key}`]: check,
  });
}

/** Adds a new choice to one meal slot, on top of whatever was already
 * planned for that day (e.g. planned "Shake ou ovo", but today it's
 * something else entirely) — persisted onto the diet itself, so it's there
 * as an option again next time this day comes around, not just for today. */
export async function addMealOption(
  profileId: string,
  dietId: string,
  days: DietDayPlan[],
  day: WeekdayKey,
  mealId: string,
  option: string,
) {
  const nextDays = days.map((dayPlan) =>
    dayPlan.day === day
      ? {
          ...dayPlan,
          meals: dayPlan.meals.map((meal) =>
            meal.id === mealId ? { ...meal, options: [...meal.options, option] } : meal,
          ),
        }
      : dayPlan,
  );
  await updateDoc(doc(requireDb(), "profiles", profileId, "diets", dietId), {
    days: nextDays,
    updatedAt: Date.now(),
  });
}

export async function setOffTrack(profileId: string, dietId: string, day: string, value: DietOffTrackNote) {
  await updateDoc(doc(requireDb(), "profiles", profileId, "diets", dietId), {
    [`offTrack.${day}`]: value,
  });
}

/**
 * Archives the current cycle (if anything was actually logged) to history,
 * then either starts a fresh cycle on the same diet ("reiniciar semana") or
 * leaves it inactive ("encerrar dieta").
 */
export async function endDietCycle(profileId: string, diet: Diet, keepActive: boolean) {
  const database = requireDb();
  const hasProgress = Object.keys(diet.progress).length > 0 || Object.keys(diet.offTrack).length > 0;

  if (hasProgress && diet.cycleStartedAt) {
    await addDoc(dietHistoryRef(profileId), {
      dietId: diet.id,
      dietName: diet.name,
      days: diet.days,
      progress: diet.progress,
      offTrack: diet.offTrack,
      cycleStartedAt: diet.cycleStartedAt,
      endedAt: Date.now(),
      createdAt: Date.now(),
    });
  }

  await updateDoc(doc(database, "profiles", profileId, "diets", diet.id), {
    active: keepActive,
    cycleStartedAt: keepActive ? Date.now() : null,
    progress: {},
    offTrack: {},
  });
}

export async function deleteDietHistoryEntry(profileId: string, entryId: string) {
  await deleteDoc(doc(requireDb(), "profiles", profileId, "dietHistory", entryId));
}

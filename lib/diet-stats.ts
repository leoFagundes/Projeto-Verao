import { WEEKDAYS, todayWeekdayKey, type Diet, type DietDayPlan, type DietHistoryEntry, type DietOffTrack, type DietProgress } from "@/types/diet";

export function progressKey(day: string, mealId: string) {
  return `${day}:${mealId}`;
}

export function weekdayIndex(day: string) {
  return WEEKDAYS.findIndex((weekday) => weekday.key === day);
}

/** "HH:MM" → minutes since midnight, or null if unparseable/empty. */
function parseTimeToMinutes(time: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Meals "due" so far this cycle: every meal on a weekday already past, plus
 * today's meals whose time has already come (or has no time set at all).
 * Meant as a less discouraging, more actionable number than the full week's
 * total right at the start of the week, when almost nothing has happened
 * yet simply because it isn't time for it.
 */
export function dueMealsSoFar(diet: Diet, now: Date = new Date()) {
  const currentIndex = weekdayIndex(todayWeekdayKey());
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let total = 0;
  let done = 0;

  for (const day of diet.days) {
    const dayIndex = weekdayIndex(day.day);
    const isPastDay = dayIndex < currentIndex;
    const isToday = dayIndex === currentIndex;

    for (const meal of day.meals) {
      const mealMinutes = parseTimeToMinutes(meal.time);
      const isDue = isPastDay || (isToday && (mealMinutes == null || mealMinutes <= nowMinutes));
      if (!isDue) continue;
      total += 1;
      if (diet.progress[progressKey(day.day, meal.id)]?.done) done += 1;
    }
  }

  return { total, done };
}

export function totalMeals(days: DietDayPlan[]) {
  return days.reduce((sum, day) => sum + day.meals.length, 0);
}

export function doneMealsCount(progress: DietProgress) {
  return Object.values(progress).filter((entry) => entry.done).length;
}

export function offTrackDaysCount(offTrack: DietOffTrack) {
  return Object.values(offTrack).filter((entry) => entry.off).length;
}

/** 0-100, or null when the plan has no meals to measure against. */
export function adherencePct(days: DietDayPlan[], progress: DietProgress) {
  const total = totalMeals(days);
  if (total === 0) return null;
  return Math.round((doneMealsCount(progress) / total) * 100);
}

export function dietSummary(diet: Diet) {
  return {
    total: totalMeals(diet.days),
    done: doneMealsCount(diet.progress),
    offTrackDays: offTrackDaysCount(diet.offTrack),
    adherence: adherencePct(diet.days, diet.progress),
  };
}

export function historySummary(entry: DietHistoryEntry) {
  return {
    total: totalMeals(entry.days),
    done: doneMealsCount(entry.progress),
    offTrackDays: offTrackDaysCount(entry.offTrack),
    adherence: adherencePct(entry.days, entry.progress),
  };
}

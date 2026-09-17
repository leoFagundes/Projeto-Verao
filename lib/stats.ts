import type { WorkoutSession } from "@/types/session";
import type { Run } from "@/types/run";
import type { BodyMeasurement, MeasurementFieldKey, MeasurementGoal } from "@/types/measurement";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function computeStreak(sessions: WorkoutSession[], runs: Run[]) {
  const activityDays = new Set<number>();
  for (const session of sessions) activityDays.add(startOfDay(session.date));
  for (const run of runs) activityDays.add(startOfDay(run.date));

  if (activityDays.size === 0) return 0;

  let cursor = startOfDay(Date.now());
  if (!activityDays.has(cursor)) {
    cursor -= DAY_MS;
    if (!activityDays.has(cursor)) return 0;
  }

  let streak = 0;
  while (activityDays.has(cursor)) {
    streak += 1;
    cursor -= DAY_MS;
  }

  return streak;
}

/** Longest-ever run of consecutive active days, anywhere in history — unlike
 * `computeStreak` (which only counts the streak ending today), this never
 * drops once earned, so it's safe to use for a permanent achievement. */
export function bestStreak(sessions: WorkoutSession[], runs: Run[]) {
  const activityDays = new Set<number>();
  for (const session of sessions) activityDays.add(startOfDay(session.date));
  for (const run of runs) activityDays.add(startOfDay(run.date));
  if (activityDays.size === 0) return 0;

  const sortedDays = Array.from(activityDays).sort((a, b) => a - b);
  let best = 1;
  let current = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i] - sortedDays[i - 1] === DAY_MS) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

export function weeklyVolume(sessions: WorkoutSession[], weeks = 8) {
  const now = startOfDay(Date.now());
  const buckets: { label: string; treinos: number }[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = now - i * 7 * DAY_MS;
    const weekEnd = weekStart + 7 * DAY_MS;
    const count = sessions.filter((s) => s.date >= weekStart && s.date < weekEnd).length;
    const label = new Date(weekStart).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    buckets.push({ label, treinos: count });
  }

  return buckets;
}

export function distanceOverTime(runs: Run[], limit = 10) {
  return [...runs]
    .sort((a, b) => a.date - b.date)
    .slice(-limit)
    .map((run) => ({
      label: new Date(run.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      km: Number(run.distanceKm.toFixed(1)),
    }));
}

export function muscleDistribution(sessions: WorkoutSession[]) {
  const counts = new Map<string, number>();

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const completedSets = exercise.sets.filter((set) => set.done).length;
      if (completedSets === 0) continue;
      const key = exercise.muscleGroup ?? "Outro";
      counts.set(key, (counts.get(key) ?? 0) + completedSets);
    }
  }

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/** Weight of the heaviest completed set for an exercise log, or null if none logged. */
function topSetWeight(exercise: WorkoutSession["exercises"][number]) {
  const weights = exercise.sets.filter((set) => set.done && set.weight != null).map((set) => set.weight as number);
  if (weights.length === 0) return null;
  return Math.max(...weights);
}

/** Weight progression (top set per session) for one exercise, oldest first. */
export function exerciseProgression(sessions: WorkoutSession[], exerciseId: string) {
  return [...sessions]
    .sort((a, b) => a.date - b.date)
    .flatMap((session) => {
      const log = session.exercises.find((exercise) => exercise.exerciseId === exerciseId);
      if (!log) return [];
      const weight = topSetWeight(log);
      if (weight == null) return [];
      return [{ date: session.date, weight }];
    });
}

/** Most recent logged weight for an exercise, used to prefill a new session. */
export function lastWeightForExercise(sessions: WorkoutSession[], exerciseId: string) {
  const progression = exerciseProgression(sessions, exerciseId);
  return progression.length > 0 ? progression[progression.length - 1].weight : null;
}

/** Heaviest weight ever logged for an exercise — the personal record. */
export function bestWeightForExercise(sessions: WorkoutSession[], exerciseId: string) {
  const progression = exerciseProgression(sessions, exerciseId);
  if (progression.length === 0) return null;
  return Math.max(...progression.map((point) => point.weight));
}

/** Longest completed set duration (seconds) for an exercise log, or null if none logged. */
function topSetDuration(exercise: WorkoutSession["exercises"][number]) {
  const durations = exercise.sets
    .filter((set) => set.done && set.durationSeconds != null)
    .map((set) => set.durationSeconds as number);
  if (durations.length === 0) return null;
  return Math.max(...durations);
}

/** Duration progression (top set per session) for one exercise, oldest first. */
export function exerciseDurationProgression(sessions: WorkoutSession[], exerciseId: string) {
  return [...sessions]
    .sort((a, b) => a.date - b.date)
    .flatMap((session) => {
      const log = session.exercises.find((exercise) => exercise.exerciseId === exerciseId);
      if (!log) return [];
      const seconds = topSetDuration(log);
      if (seconds == null) return [];
      return [{ date: session.date, seconds }];
    });
}

/** Most recent logged duration for an exercise, used to prefill a new session. */
export function lastDurationForExercise(sessions: WorkoutSession[], exerciseId: string) {
  const progression = exerciseDurationProgression(sessions, exerciseId);
  return progression.length > 0 ? progression[progression.length - 1].seconds : null;
}

/** Reps of the last completed set for an exercise log, or null if none logged. */
function lastSetReps(exercise: WorkoutSession["exercises"][number]) {
  const doneSets = exercise.sets.filter((set) => set.done && set.reps.trim() !== "");
  if (doneSets.length === 0) return null;
  return doneSets[doneSets.length - 1].reps;
}

/** Most recent logged reps for an exercise, used to prefill a new session —
 * same idea as weight/duration: remembers what was actually typed last time
 * instead of always resetting to the workout plan's static target. */
export function lastRepsForExercise(sessions: WorkoutSession[], exerciseId: string) {
  const sorted = [...sessions].sort((a, b) => b.date - a.date);
  for (const session of sorted) {
    const log = session.exercises.find((exercise) => exercise.exerciseId === exerciseId);
    if (!log) continue;
    const reps = lastSetReps(log);
    if (reps != null) return reps;
  }
  return null;
}

/** Longest duration ever logged for an exercise — the personal record. */
export function bestDurationForExercise(sessions: WorkoutSession[], exerciseId: string) {
  const progression = exerciseDurationProgression(sessions, exerciseId);
  if (progression.length === 0) return null;
  return Math.max(...progression.map((point) => point.seconds));
}

/**
 * Exercises in `newLogs` whose top set beats the best weight or duration logged
 * before this session (from `previousSessions`, i.e. sessions that existed prior
 * to saving). Used to celebrate personal records right after a workout is logged.
 */
export function detectNewRecords(
  previousSessions: WorkoutSession[],
  newLogs: WorkoutSession["exercises"],
) {
  const records: { name: string; weight?: number; seconds?: number }[] = [];

  for (const log of newLogs) {
    const newBestWeight = topSetWeight(log);
    if (newBestWeight != null) {
      const previousBest = bestWeightForExercise(previousSessions, log.exerciseId);
      if (previousBest != null && newBestWeight > previousBest) {
        records.push({ name: log.name, weight: newBestWeight });
      }
    }

    const newBestDuration = topSetDuration(log);
    if (newBestDuration != null) {
      const previousBest = bestDurationForExercise(previousSessions, log.exerciseId);
      if (previousBest != null && newBestDuration > previousBest) {
        records.push({ name: log.name, seconds: newBestDuration });
      }
    }
  }

  return records;
}

/**
 * Date of every time, across all of history, an exercise's top set beat the
 * best (weight or duration) logged before it — i.e. every moment a 🏆 record
 * toast would have fired. Replays sessions oldest-first so it matches `detectNewRecords`.
 */
export function recordDates(sessions: WorkoutSession[]): number[] {
  const sorted = [...sessions].sort((a, b) => a.date - b.date);
  const bestWeightSoFar = new Map<string, number>();
  const bestDurationSoFar = new Map<string, number>();
  const dates: number[] = [];

  for (const session of sorted) {
    for (const log of session.exercises) {
      const topWeight = topSetWeight(log);
      if (topWeight != null) {
        const previousBest = bestWeightSoFar.get(log.exerciseId);
        if (previousBest != null && topWeight > previousBest) dates.push(session.date);
        bestWeightSoFar.set(log.exerciseId, Math.max(previousBest ?? -Infinity, topWeight));
      }

      const topDuration = topSetDuration(log);
      if (topDuration != null) {
        const previousBest = bestDurationSoFar.get(log.exerciseId);
        if (previousBest != null && topDuration > previousBest) dates.push(session.date);
        bestDurationSoFar.set(log.exerciseId, Math.max(previousBest ?? -Infinity, topDuration));
      }
    }
  }

  return dates;
}

export function totalRecordCount(sessions: WorkoutSession[]) {
  return recordDates(sessions).length;
}

export function totalDistance(runs: Run[]) {
  return runs.reduce((sum, run) => sum + run.distanceKm, 0);
}

/** Longest distance covered in a single run — distinct from the cumulative total. */
export function longestSingleRun(runs: Run[]) {
  if (runs.length === 0) return 0;
  return Math.max(...runs.map((run) => run.distanceKm));
}

export function averagePace(runs: Run[]) {
  const valid = runs.filter((run) => run.paceSecPerKm > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((sum, run) => sum + run.paceSecPerKm, 0) / valid.length;
}

export function bestPace(runs: Run[]) {
  const valid = runs.filter((run) => run.paceSecPerKm > 0);
  if (valid.length === 0) return 0;
  return Math.min(...valid.map((run) => run.paceSecPerKm));
}

/** One field's values over time, oldest first, skipping entries where it wasn't logged. */
export function measurementSeries(measurements: BodyMeasurement[], field: MeasurementFieldKey) {
  return [...measurements]
    .sort((a, b) => a.date - b.date)
    .flatMap((entry) => {
      const value = entry[field];
      return value == null ? [] : [{ date: entry.date, value }];
    });
}

/** Latest and previous logged value for a field, for a quick delta display. */
export function measurementTrend(measurements: BodyMeasurement[], field: MeasurementFieldKey) {
  const series = measurementSeries(measurements, field);
  const latest = series[series.length - 1] ?? null;
  const previous = series[series.length - 2] ?? null;
  const delta = latest && previous ? Number((latest.value - previous.value).toFixed(1)) : null;
  return { latest, delta };
}

/**
 * 0-100 progress toward a measurement goal. Works whether the goal means
 * growing (target > start) or shrinking (target < start) — direction falls
 * out of the sign of the two differences.
 */
export function goalProgress(goal: MeasurementGoal, currentValue: number | null) {
  if (currentValue == null) return null;
  const { startValue, targetValue } = goal;
  if (startValue === targetValue) return 100;
  const raw = ((currentValue - startValue) / (targetValue - startValue)) * 100;
  return Math.max(0, Math.min(100, raw));
}

/** Body Mass Index from the most recent entry that has both weight and height. */
export function latestBmi(measurements: BodyMeasurement[]) {
  const entry = [...measurements]
    .sort((a, b) => b.date - a.date)
    .find((item) => item.weightKg != null && item.heightCm != null);
  if (!entry || !entry.weightKg || !entry.heightCm) return null;
  const heightM = entry.heightCm / 100;
  return Number((entry.weightKg / (heightM * heightM)).toFixed(1));
}

export type HeatmapDay = { date: number; count: number; level: 0 | 1 | 2 | 3 | 4 };

/**
 * Activity per day for the last `weeks` weeks, grouped into calendar weeks
 * (Monday-first) so it can be rendered as a GitHub-style heatmap grid.
 */
export function activityHeatmap(sessions: WorkoutSession[], runs: Run[], weeks = 16): HeatmapDay[][] {
  const counts = new Map<number, number>();
  for (const session of sessions) {
    const day = startOfDay(session.date);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  for (const run of runs) {
    const day = startOfDay(run.date);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const today = startOfDay(Date.now());
  const todayWeekday = (new Date(today).getDay() + 6) % 7; // Monday = 0
  const gridEnd = today + (6 - todayWeekday) * DAY_MS; // end of this week (Sunday)
  const gridStart = gridEnd - (weeks * 7 - 1) * DAY_MS;

  const days: HeatmapDay[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor += DAY_MS) {
    const count = counts.get(cursor) ?? 0;
    const level: HeatmapDay["level"] = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : 4;
    days.push({ date: cursor, count, level });
  }

  const gridWeeks: HeatmapDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    gridWeeks.push(days.slice(i, i + 7));
  }
  return gridWeeks;
}

export type CalendarDay = { date: number; inMonth: boolean; sessionCount: number; runCount: number };

/** Full weeks (Monday-first) spanning the month that `monthAnchor` falls in. */
export function monthCalendar(sessions: WorkoutSession[], runs: Run[], monthAnchor: number): CalendarDay[] {
  const anchor = new Date(monthAnchor);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  const firstOfMonth = startOfDay(new Date(year, month, 1).getTime());
  const firstWeekday = (new Date(firstOfMonth).getDay() + 6) % 7;
  const gridStart = firstOfMonth - firstWeekday * DAY_MS;

  const lastOfMonth = startOfDay(new Date(year, month + 1, 0).getTime());
  const lastWeekday = (new Date(lastOfMonth).getDay() + 6) % 7;
  const gridEnd = lastOfMonth + (6 - lastWeekday) * DAY_MS;

  const sessionCounts = new Map<number, number>();
  for (const session of sessions) {
    const day = startOfDay(session.date);
    sessionCounts.set(day, (sessionCounts.get(day) ?? 0) + 1);
  }
  const runCounts = new Map<number, number>();
  for (const run of runs) {
    const day = startOfDay(run.date);
    runCounts.set(day, (runCounts.get(day) ?? 0) + 1);
  }

  const days: CalendarDay[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor += DAY_MS) {
    days.push({
      date: cursor,
      inMonth: new Date(cursor).getMonth() === month,
      sessionCount: sessionCounts.get(cursor) ?? 0,
      runCount: runCounts.get(cursor) ?? 0,
    });
  }
  return days;
}

export function recentActivity(sessions: WorkoutSession[], runs: Run[], limit = 5) {
  const combined = [
    ...sessions.map((s) => ({ type: "treino" as const, date: s.date, title: s.workoutName, id: s.id })),
    ...runs.map((r) => ({
      type: "corrida" as const,
      date: r.date,
      title: `${r.distanceKm.toFixed(1)} km`,
      id: r.id,
    })),
  ];

  return combined.sort((a, b) => b.date - a.date).slice(0, limit);
}

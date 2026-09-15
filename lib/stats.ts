import type { WorkoutSession } from "@/types/session";
import type { Run } from "@/types/run";
import type { BodyMeasurement, MeasurementFieldKey } from "@/types/measurement";

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

/**
 * Exercises in `newLogs` whose top set beats the best weight logged before this
 * session (from `previousSessions`, i.e. sessions that existed prior to saving).
 * Used to celebrate personal records right after a workout is logged.
 */
export function detectNewRecords(
  previousSessions: WorkoutSession[],
  newLogs: WorkoutSession["exercises"],
) {
  const records: { name: string; weight: number }[] = [];

  for (const log of newLogs) {
    const newBest = topSetWeight(log);
    if (newBest == null) continue;
    const previousBest = bestWeightForExercise(previousSessions, log.exerciseId);
    if (previousBest != null && newBest > previousBest) {
      records.push({ name: log.name, weight: newBest });
    }
  }

  return records;
}

export function totalDistance(runs: Run[]) {
  return runs.reduce((sum, run) => sum + run.distanceKm, 0);
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

import {
  Award,
  BarChart3,
  Compass,
  Crown,
  Dumbbell,
  Flag,
  Flame,
  Gem,
  Globe,
  Medal,
  Moon,
  Ribbon,
  Rocket,
  Ruler,
  Satellite,
  Sparkles,
  Sunrise,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { FaRunning } from "react-icons/fa";
import type { IconType } from "react-icons";

import type { WorkoutSession } from "@/types/session";
import type { Run } from "@/types/run";
import type { BodyMeasurement } from "@/types/measurement";

import { bestStreak, longestSingleRun, recordDates, totalDistance } from "./stats";

const DAY_MS = 24 * 60 * 60 * 1000;

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon | IconType;
};

export type AchievementContext = {
  sessions: WorkoutSession[];
  runs: Run[];
  measurements: BodyMeasurement[];
};

function startOfDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Date the Nth item (1-indexed, oldest first) happened, or null if it hasn't yet. */
function nthDate(dates: number[], n: number): number | null {
  const sorted = [...dates].sort((a, b) => a - b);
  return sorted[n - 1] ?? null;
}

function cumulativeDistanceDate(runs: Run[], thresholdKm: number): number | null {
  const sorted = [...runs].sort((a, b) => a.date - b.date);
  let sum = 0;
  for (const run of sorted) {
    sum += run.distanceKm;
    if (sum >= thresholdKm) return run.date;
  }
  return null;
}

function singleRunDistanceDate(runs: Run[], thresholdKm: number): number | null {
  const sorted = [...runs].sort((a, b) => a.date - b.date);
  const hit = sorted.find((run) => run.distanceKm >= thresholdKm);
  return hit ? hit.date : null;
}

/** Date the streak first reached `thresholdDays` consecutive active days, anywhere in history. */
function streakDate(sessions: WorkoutSession[], runs: Run[], thresholdDays: number): number | null {
  const activityDays = new Set<number>();
  for (const session of sessions) activityDays.add(startOfDay(session.date));
  for (const run of runs) activityDays.add(startOfDay(run.date));
  if (activityDays.size === 0) return null;

  const sortedDays = Array.from(activityDays).sort((a, b) => a - b);
  let runStart = sortedDays[0];
  let runLength = 1;
  if (runLength >= thresholdDays) return runStart + (thresholdDays - 1) * DAY_MS;

  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i] - sortedDays[i - 1] === DAY_MS) {
      runLength += 1;
    } else {
      runStart = sortedDays[i];
      runLength = 1;
    }
    if (runLength >= thresholdDays) return runStart + (thresholdDays - 1) * DAY_MS;
  }
  return null;
}

export type AchievementProgress = { current: number; target: number; unit: string };

type Def = Achievement & {
  unlockedAt: (ctx: AchievementContext) => number | null;
  /** null when a partial-progress reading genuinely doesn't make sense (e.g. "trained before 7am"). */
  progress: (ctx: AchievementContext) => AchievementProgress | null;
};

const WORKOUT_MILESTONES = [1, 10, 50, 100, 250, 500];
const WORKOUT_ICONS = [Dumbbell, Medal, Award, Trophy, Ribbon, Gem];
const DISTANCE_MILESTONES = [10, 50, 100, 250, 500];
const DISTANCE_ICONS = [Target, Compass, Globe, Rocket, Satellite];
const SINGLE_RUN_MILESTONES = [
  { km: 2, title: "2km numa corrida", icon: Target },
  { km: 3, title: "3km numa corrida", icon: Target },
  { km: 4, title: "4km numa corrida", icon: Flag },
  { km: 5, title: "5km numa corrida", icon: Flag },
  { km: 10, title: "10km numa corrida", icon: Medal },
  { km: 15, title: "15km numa corrida", icon: Award },
  { km: 21.1, title: "Meia maratona", icon: Ribbon },
  { km: 42.2, title: "Maratona", icon: Trophy },
];
const STREAK_MILESTONES = [7, 30, 60, 100];
const STREAK_ICONS = [Flame, Zap, Gem, Crown];
const MEASUREMENT_MILESTONES = [1, 10, 25];
const RECORD_MILESTONES = [1, 10, 25];

const DEFS: Def[] = [
  ...WORKOUT_MILESTONES.map(
    (n, i): Def => ({
      id: `workouts-${n}`,
      title: n === 1 ? "Primeiro treino" : `${n} treinos`,
      description: n === 1 ? "Registre seu primeiro treino" : `Complete ${n} treinos`,
      icon: WORKOUT_ICONS[i],
      unlockedAt: (ctx) => nthDate(ctx.sessions.map((s) => s.date), n),
      progress: (ctx) => ({ current: ctx.sessions.length, target: n, unit: "treinos" }),
    }),
  ),
  {
    id: "first-run",
    title: "Primeira corrida",
    description: "Registre sua primeira corrida",
    icon: FaRunning,
    unlockedAt: (ctx) => nthDate(ctx.runs.map((r) => r.date), 1),
    progress: (ctx) => ({ current: ctx.runs.length, target: 1, unit: "corridas" }),
  },
  ...DISTANCE_MILESTONES.map(
    (n, i): Def => ({
      id: `distance-${n}`,
      title: `${n}km rodados`,
      description: `Acumule ${n}km em corridas`,
      icon: DISTANCE_ICONS[i],
      unlockedAt: (ctx) => cumulativeDistanceDate(ctx.runs, n),
      progress: (ctx) => ({ current: totalDistance(ctx.runs), target: n, unit: "km" }),
    }),
  ),
  ...SINGLE_RUN_MILESTONES.map(
    ({ km, title, icon }): Def => ({
      id: `run-${km}km`,
      title,
      description: `Complete ${km}km numa única corrida`,
      icon,
      unlockedAt: (ctx) => singleRunDistanceDate(ctx.runs, km),
      progress: (ctx) => ({ current: longestSingleRun(ctx.runs), target: km, unit: "km" }),
    }),
  ),
  ...STREAK_MILESTONES.map(
    (n, i): Def => ({
      id: `streak-${n}`,
      title: `${n} dias seguidos`,
      description: `Mantenha uma sequência de ${n} dias`,
      icon: STREAK_ICONS[i],
      unlockedAt: (ctx) => streakDate(ctx.sessions, ctx.runs, n),
      progress: (ctx) => ({ current: bestStreak(ctx.sessions, ctx.runs), target: n, unit: "dias" }),
    }),
  ),
  ...MEASUREMENT_MILESTONES.map(
    (n): Def => ({
      id: `measurements-${n}`,
      title: n === 1 ? "Primeira medida" : `${n} registros de medida`,
      description: n === 1 ? "Registre sua primeira medição corporal" : `Registre suas medidas ${n} vezes`,
      icon: n === 1 ? Ruler : BarChart3,
      unlockedAt: (ctx) => nthDate(ctx.measurements.map((m) => m.date), n),
      progress: (ctx) => ({ current: ctx.measurements.length, target: n, unit: "registros" }),
    }),
  ),
  ...RECORD_MILESTONES.map(
    (n): Def => ({
      id: `records-${n}`,
      title: n === 1 ? "Primeiro recorde" : `${n} recordes pessoais`,
      description: n === 1 ? "Bata um recorde pessoal em algum exercício" : `Bata ${n} recordes pessoais ao longo do tempo`,
      icon: n === 1 ? Trophy : Crown,
      unlockedAt: (ctx) => nthDate(recordDates(ctx.sessions), n),
      progress: (ctx) => ({ current: recordDates(ctx.sessions).length, target: n, unit: "recordes" }),
    }),
  ),
  {
    id: "all-rounder",
    title: "Completo",
    description: "Registre um treino, uma corrida e uma medida",
    icon: Sparkles,
    unlockedAt: (ctx) => {
      const workout = nthDate(ctx.sessions.map((s) => s.date), 1);
      const run = nthDate(ctx.runs.map((r) => r.date), 1);
      const measurement = nthDate(ctx.measurements.map((m) => m.date), 1);
      if (workout == null || run == null || measurement == null) return null;
      return Math.max(workout, run, measurement);
    },
    progress: (ctx) => {
      const met = [ctx.sessions.length >= 1, ctx.runs.length >= 1, ctx.measurements.length >= 1].filter(
        Boolean,
      ).length;
      return { current: met, target: 3, unit: "categorias" };
    },
  },
  {
    id: "early-bird",
    title: "Madrugador",
    description: "Registre um treino ou corrida antes das 7h",
    icon: Sunrise,
    unlockedAt: (ctx) =>
      nthDate(
        [...ctx.sessions.map((s) => s.createdAt), ...ctx.runs.map((r) => r.createdAt)].filter(
          (ts) => new Date(ts).getHours() < 7,
        ),
        1,
      ),
    progress: () => null,
  },
  {
    id: "night-owl",
    title: "Coruja",
    description: "Registre um treino ou corrida depois das 22h",
    icon: Moon,
    unlockedAt: (ctx) =>
      nthDate(
        [...ctx.sessions.map((s) => s.createdAt), ...ctx.runs.map((r) => r.createdAt)].filter(
          (ts) => new Date(ts).getHours() >= 22,
        ),
        1,
      ),
    progress: () => null,
  },
  {
    id: "interval-master",
    title: "Mestre dos tiros",
    description: "Complete 10 corridas de tiro",
    icon: Zap,
    unlockedAt: (ctx) => nthDate(ctx.runs.filter((r) => r.type === "tiro").map((r) => r.date), 10),
    progress: (ctx) => ({ current: ctx.runs.filter((r) => r.type === "tiro").length, target: 10, unit: "tiros" }),
  },
  {
    id: "run-variety",
    title: "Corredor versátil",
    description: "Registre uma corrida normal e uma de tiro",
    icon: Target,
    unlockedAt: (ctx) => {
      const normal = nthDate(ctx.runs.filter((r) => r.type === "normal").map((r) => r.date), 1);
      const tiro = nthDate(ctx.runs.filter((r) => r.type === "tiro").map((r) => r.date), 1);
      if (normal == null || tiro == null) return null;
      return Math.max(normal, tiro);
    },
    progress: (ctx) => {
      const met = [
        ctx.runs.some((r) => r.type === "normal"),
        ctx.runs.some((r) => r.type === "tiro"),
      ].filter(Boolean).length;
      return { current: met, target: 2, unit: "tipos" };
    },
  },
];

export const ACHIEVEMENTS: Achievement[] = DEFS.map(({ id, title, description, icon }) => ({
  id,
  title,
  description,
  icon,
}));

/** Map of achievement id → unlock date, computed purely from existing data — no separate stored state to drift or fall out of sync. */
export function unlockedAchievements(
  sessions: WorkoutSession[],
  runs: Run[],
  measurements: BodyMeasurement[],
): Map<string, number> {
  const ctx: AchievementContext = { sessions, runs, measurements };
  const unlocked = new Map<string, number>();
  for (const def of DEFS) {
    const date = def.unlockedAt(ctx);
    if (date != null) unlocked.set(def.id, date);
  }
  return unlocked;
}

/** Current progress toward one achievement, or null if it isn't a "partial credit" kind. */
export function achievementProgress(id: string, sessions: WorkoutSession[], runs: Run[], measurements: BodyMeasurement[]): AchievementProgress | null {
  const def = DEFS.find((d) => d.id === id);
  return def ? def.progress({ sessions, runs, measurements }) : null;
}

/** Achievements present in `after` but not in `before` — for celebratory UI right after a save. */
export function detectNewlyUnlocked(before: AchievementContext, after: AchievementContext): Achievement[] {
  const beforeUnlocked = unlockedAchievements(before.sessions, before.runs, before.measurements);
  const afterUnlocked = unlockedAchievements(after.sessions, after.runs, after.measurements);
  return ACHIEVEMENTS.filter((achievement) => !beforeUnlocked.has(achievement.id) && afterUnlocked.has(achievement.id));
}

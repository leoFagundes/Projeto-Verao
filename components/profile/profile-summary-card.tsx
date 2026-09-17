"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useMemo } from "react";

import { Avatar } from "@/components/ui/avatar";
import { ACHIEVEMENTS, unlockedAchievements } from "@/lib/achievements";
import { useMeasurements } from "@/lib/hooks/use-measurements";
import { useRuns } from "@/lib/hooks/use-runs";
import { useSessions } from "@/lib/hooks/use-sessions";
import { computeStreak, totalDistance } from "@/lib/stats";
import { THEME_META } from "@/lib/theme";
import type { Profile } from "@/types/profile";

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--field-bg)] px-2 py-2 text-center">
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-slate-500">{label}</p>
    </div>
  );
}

export function ProfileSummaryCard({ profile, index }: { profile: Profile; index: number }) {
  const theme = THEME_META[profile.theme];
  const { sessions, loading: sessionsLoading } = useSessions(profile.id);
  const { runs, loading: runsLoading } = useRuns(profile.id);
  const { measurements, loading: measurementsLoading } = useMeasurements(profile.id);
  const loading = sessionsLoading || runsLoading || measurementsLoading;

  const unlocked = useMemo(
    () => unlockedAchievements(sessions, runs, measurements),
    [sessions, runs, measurements],
  );
  const streak = useMemo(() => computeStreak(sessions, runs), [sessions, runs]);
  const km = totalDistance(runs);
  const pct = ACHIEVEMENTS.length > 0 ? (unlocked.size / ACHIEVEMENTS.length) * 100 : 0;

  const topTrophies = [...ACHIEVEMENTS]
    .filter((achievement) => unlocked.has(achievement.id))
    .sort((a, b) => (unlocked.get(b.id) ?? 0) - (unlocked.get(a.id) ?? 0))
    .slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
      data-theme={profile.theme}
      className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <div className="flex items-center gap-3">
        <Avatar
          name={profile.name}
          photoUrl={profile.photoUrl}
          className="h-12 w-12 shrink-0 rounded-2xl"
          textClassName="text-lg"
        />
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">{profile.name}</h3>
          <p className="text-xs text-slate-400">{theme.label}</p>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 h-24 animate-pulse rounded-2xl bg-white/5" />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            <StatBlock label="Treinos" value={String(sessions.length)} />
            <StatBlock label="Corridas" value={String(runs.length)} />
            <StatBlock label="Km" value={km.toFixed(0)} />
            <StatBlock label="Sequência" value={`${streak}d`} />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-medium text-white">
                <Trophy className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                {unlocked.size}/{ACHIEVEMENTS.length} conquistas
              </span>
              <span className="text-slate-500">{Math.round(pct)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--field-bg)]">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }}
              />
            </div>
          </div>

          {topTrophies.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {topTrophies.map((achievement) => (
                <span
                  key={achievement.id}
                  title={achievement.title}
                  className="grid h-7 w-7 place-items-center rounded-full"
                  style={{ background: "var(--accent-soft)" }}
                >
                  <achievement.icon className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                </span>
              ))}
            </div>
          ) : null}
        </>
      )}
    </motion.div>
  );
}

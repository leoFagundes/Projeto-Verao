"use client";

import { useMemo, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { ACHIEVEMENTS, unlockedAchievements } from "@/lib/achievements";
import { useMeasurements } from "@/lib/hooks/use-measurements";
import { useRuns } from "@/lib/hooks/use-runs";
import { useSessions } from "@/lib/hooks/use-sessions";
import { bestStreak, totalDistance, totalRecordCount } from "@/lib/stats";
import { THEME_META } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/profile";

function useProfileStats(profileId: string) {
  const { sessions, loading: sessionsLoading } = useSessions(profileId);
  const { runs, loading: runsLoading } = useRuns(profileId);
  const { measurements, loading: measurementsLoading } = useMeasurements(profileId);

  const stats = useMemo(
    () => ({
      workouts: sessions.length,
      runs: runs.length,
      km: totalDistance(runs),
      streak: bestStreak(sessions, runs),
      achievements: unlockedAchievements(sessions, runs, measurements).size,
      records: totalRecordCount(sessions),
    }),
    [sessions, runs, measurements],
  );

  return { stats, loading: sessionsLoading || runsLoading || measurementsLoading };
}

type MetricRow = {
  label: string;
  format: (value: number) => string;
  pick: (stats: ReturnType<typeof useProfileStats>["stats"]) => number;
};

const METRICS: MetricRow[] = [
  { label: "Treinos", format: (v) => String(v), pick: (s) => s.workouts },
  { label: "Corridas", format: (v) => String(v), pick: (s) => s.runs },
  { label: "Km percorridos", format: (v) => v.toFixed(1), pick: (s) => s.km },
  { label: "Maior sequência", format: (v) => `${v}d`, pick: (s) => s.streak },
  { label: "Recordes", format: (v) => String(v), pick: (s) => s.records },
  { label: "Conquistas", format: (v) => `${v}/${ACHIEVEMENTS.length}`, pick: (s) => s.achievements },
];

function ProfilePicker({
  profiles,
  value,
  onChange,
}: {
  profiles: Profile[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {profiles.map((profile) => {
        const selected = profile.id === value;
        return (
          <button
            key={profile.id}
            type="button"
            onClick={() => onChange(profile.id)}
            aria-pressed={selected}
            className={cn(
              "flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 transition",
              selected
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]",
            )}
          >
            <Avatar name={profile.name} photoUrl={profile.photoUrl} className="h-6 w-6 rounded-full" textClassName="text-[9px]" />
            <span className="text-xs font-medium text-white">{profile.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function CompareSkeleton() {
  return (
    <div className="mt-4 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-3.5 w-16 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-6 animate-pulse rounded bg-white/5" />
        ))}
      </div>
    </div>
  );
}

/** Requires at least 2 profiles — the caller mounts this only once that's true,
 * so the picker state can seed straight from real ids on the very first render. */
export function ProfileCompare({ profiles }: { profiles: Profile[] }) {
  const [profileAId, setProfileAId] = useState(profiles[0].id);
  const [profileBId, setProfileBId] = useState(profiles[1].id);

  const profileA = profiles.find((profile) => profile.id === profileAId) ?? profiles[0];
  const profileB = profiles.find((profile) => profile.id === profileBId) ?? profiles[1];
  const { stats: statsA, loading: loadingA } = useProfileStats(profileA.id);
  const { stats: statsB, loading: loadingB } = useProfileStats(profileB.id);
  const loading = loadingA || loadingB;

  return (
    <section className="mt-10">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Cabeça a cabeça</p>
      <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Comparar perfis</h2>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        <ProfilePicker profiles={profiles} value={profileAId} onChange={setProfileAId} />
        <ProfilePicker profiles={profiles} value={profileBId} onChange={setProfileBId} />
      </div>

      {loading ? (
        <CompareSkeleton />
      ) : (
        <div className="mt-4 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-3">
            {[profileA, profileB].map((profile) => (
              <div key={profile.id} className="flex flex-col items-center gap-2 text-center">
                <Avatar
                  name={profile.name}
                  photoUrl={profile.photoUrl}
                  className="h-14 w-14 rounded-2xl"
                  textClassName="text-lg"
                />
                <p className="truncate text-sm font-semibold text-white">{profile.name}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {METRICS.map((metric) => {
              const valueA = metric.pick(statsA);
              const valueB = metric.pick(statsB);
              const aWins = valueA > valueB;
              const bWins = valueB > valueA;
              const total = valueA + valueB;
              const pctA = total > 0 ? (valueA / total) * 100 : 50;
              const pctB = 100 - pctA;
              const colorA = THEME_META[profileA.theme].accent;
              const colorB = THEME_META[profileB.theme].accent;

              return (
                <div key={metric.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold" style={{ color: aWins ? colorA : "white" }}>
                      {metric.format(valueA)}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.1em] text-slate-500">{metric.label}</span>
                    <span className="font-semibold" style={{ color: bWins ? colorB : "white" }}>
                      {metric.format(valueB)}
                    </span>
                  </div>
                  <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-[var(--field-bg)]">
                    <div style={{ width: `${pctA}%`, background: colorA }} />
                    <div style={{ width: `${pctB}%`, background: colorB }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { ArrowRight, Dumbbell, Flame, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaRunning } from "react-icons/fa";

import { AchievementGrid } from "@/components/achievements/achievement-grid";
import { ActivityHeatmap } from "@/components/charts/activity-heatmap";
import { DistanceChart } from "@/components/charts/distance-chart";
import { MonthCalendar } from "@/components/charts/month-calendar";
import { MuscleDistributionChart } from "@/components/charts/muscle-distribution-chart";
import { WeeklyVolumeChart } from "@/components/charts/weekly-volume-chart";
import { Card, SectionLabel } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { ACHIEVEMENTS, unlockedAchievements } from "@/lib/achievements";
import { useMeasurements } from "@/lib/hooks/use-measurements";
import { useRuns } from "@/lib/hooks/use-runs";
import { useSessions } from "@/lib/hooks/use-sessions";
import {
  activityHeatmap,
  type CalendarDay,
  computeStreak,
  distanceOverTime,
  monthCalendar,
  muscleDistribution,
  recentActivity,
  totalDistance,
  weeklyVolume,
} from "@/lib/stats";
import { addMonths, formatDate, formatPace, startOfMonth } from "@/lib/utils";

export default function ProfileOverviewPage() {
  const params = useParams<{ id: string }>();
  const { sessions, loading: sessionsLoading } = useSessions(params.id);
  const { runs, loading: runsLoading } = useRuns(params.id);
  const { measurements } = useMeasurements(params.id);

  const [monthAnchor, setMonthAnchor] = useState<number | null>(null);
  const [todayTimestamp, setTodayTimestamp] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  useEffect(() => {
    // Today's real date can't be computed during render (impure) — an
    // effect is the correct place for this one-time read.
    /* eslint-disable react-hooks/set-state-in-effect */
    const now = Date.now();
    setMonthAnchor(startOfMonth(now));
    setTodayTimestamp(new Date(now).setHours(0, 0, 0, 0));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const streak = useMemo(() => computeStreak(sessions, runs), [sessions, runs]);
  const volume = useMemo(() => weeklyVolume(sessions), [sessions]);
  const distance = useMemo(() => distanceOverTime(runs), [runs]);
  const muscles = useMemo(() => muscleDistribution(sessions), [sessions]);
  const activity = useMemo(() => recentActivity(sessions, runs), [sessions, runs]);
  const heatmap = useMemo(() => activityHeatmap(sessions, runs), [sessions, runs]);
  const calendarDays: CalendarDay[] = useMemo(
    () => (monthAnchor == null ? [] : monthCalendar(sessions, runs, monthAnchor)),
    [sessions, runs, monthAnchor],
  );
  const unlocked = useMemo(
    () => unlockedAchievements(sessions, runs, measurements),
    [sessions, runs, measurements],
  );
  const km = totalDistance(runs);

  const monthLabel = monthAnchor == null ? "" : new Date(monthAnchor).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const selectedDay = calendarDays.find((day) => day.date === selectedDate) ?? null;
  const selectedDaySessions = selectedDay
    ? sessions.filter((s) => new Date(s.date).setHours(0, 0, 0, 0) === selectedDay.date)
    : [];
  const selectedDayRuns = selectedDay
    ? runs.filter((r) => new Date(r.date).setHours(0, 0, 0, 0) === selectedDay.date)
    : [];

  const loading = sessionsLoading || runsLoading;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Treinos"
          value={sessions.length}
          hint="Sessões concluídas"
          icon={<Dumbbell className="h-4 w-4" style={{ color: "var(--accent)" }} />}
        />
        <StatTile
          label="Corridas"
          value={runs.length}
          hint="Registradas"
          icon={<FaRunning className="h-4 w-4" style={{ color: "var(--accent)" }} />}
        />
        <StatTile
          label="Distância"
          value={`${km.toFixed(1)} km`}
          hint="Total acumulado"
          icon={<MapPin className="h-4 w-4" style={{ color: "var(--accent)" }} />}
        />
        <StatTile
          label="Sequência"
          value={`${streak}d`}
          hint="Dias seguidos"
          icon={<Flame className="h-4 w-4" style={{ color: "var(--accent)" }} />}
        />
      </div>

      <Card className="p-5">
        <SectionLabel>Conquistas</SectionLabel>
        <h3 className="mt-1 text-lg font-semibold text-white">
          {unlocked.size} de {ACHIEVEMENTS.length} troféus desbloqueados
        </h3>
        <div className="mt-4">
          <AchievementGrid unlocked={unlocked} sessions={sessions} runs={runs} measurements={measurements} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionLabel>Calendário</SectionLabel>
          {monthAnchor == null || todayTimestamp == null ? (
            <div className="mt-4 h-[280px] animate-pulse rounded-2xl bg-white/5" />
          ) : (
            <>
              <div className="mt-1">
                <MonthCalendar
                  days={calendarDays}
                  monthLabel={monthLabel}
                  todayTimestamp={todayTimestamp}
                  selectedDate={selectedDate}
                  onPrevMonth={() => {
                    setMonthAnchor((current) => (current == null ? current : addMonths(current, -1)));
                    setSelectedDate(null);
                  }}
                  onNextMonth={() => {
                    setMonthAnchor((current) => (current == null ? current : addMonths(current, 1)));
                    setSelectedDate(null);
                  }}
                  onSelectDay={(day) => setSelectedDate((current) => (current === day.date ? null : day.date))}
                />
              </div>
              {selectedDay ? (
                <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
                  {selectedDaySessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-sm text-slate-200"
                    >
                      <Dumbbell className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
                      {s.workoutName}
                    </div>
                  ))}
                  {selectedDayRuns.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-sm text-slate-200"
                    >
                      <FaRunning className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
                      {r.distanceKm.toFixed(1)} km · {formatPace(r.paceSecPerKm)}
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </Card>

        <Card className="p-5">
          <SectionLabel>Consistência</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-white">Últimas 16 semanas</h3>
          <div className="mt-4 overflow-x-auto">
            <ActivityHeatmap weeks={heatmap} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionLabel>Volume de treino</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-white">Últimas 8 semanas</h3>
          <div className="mt-4">
            <WeeklyVolumeChart data={volume} />
          </div>
        </Card>

        <Card className="p-5">
          <SectionLabel>Corridas</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-white">Distância por corrida</h3>
          <div className="mt-4">
            {distance.length === 0 ? (
              <div className="grid h-[180px] place-items-center text-sm text-slate-500">
                Nenhuma corrida registrada ainda.
              </div>
            ) : (
              <DistanceChart data={distance} />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <SectionLabel>Foco de treino</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-white">Grupos musculares</h3>
          <div className="mt-4">
            <MuscleDistributionChart data={muscles} />
          </div>
        </Card>

        <Card className="p-5">
          <SectionLabel>Atividade recente</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-white">Últimos registros</h3>
          <div className="mt-4 space-y-2">
            {!loading && activity.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma atividade ainda. Registre um treino ou uma corrida para começar.
              </p>
            ) : (
              activity.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="shrink-0" style={{ color: "var(--accent)" }}>
                      {item.type === "treino" ? (
                        <Dumbbell className="h-4 w-4" />
                      ) : (
                        <FaRunning className="h-4 w-4" />
                      )}
                    </span>
                    <span className="truncate text-sm font-medium text-white">{item.title}</span>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{formatDate(item.date)}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {runs.length > 0 ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionLabel>Ritmo</SectionLabel>
              <h3 className="mt-1 text-lg font-semibold text-white">Melhor ritmo registrado</h3>
            </div>
            <span className="text-2xl font-bold text-white">
              {formatPace(Math.min(...runs.map((r) => r.paceSecPerKm).filter(Boolean)))}
            </span>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/perfil/${params.id}/treinos`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Ver todos os treinos
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={`/perfil/${params.id}/corridas`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Ver todas as corridas
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={`/perfil/${params.id}/medidas`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Ver medidas corporais
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

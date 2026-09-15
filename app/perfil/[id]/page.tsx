"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import { ActivityHeatmap } from "@/components/charts/activity-heatmap";
import { DistanceChart } from "@/components/charts/distance-chart";
import { MuscleDistributionChart } from "@/components/charts/muscle-distribution-chart";
import { WeeklyVolumeChart } from "@/components/charts/weekly-volume-chart";
import { Card, SectionLabel } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { useRuns } from "@/lib/hooks/use-runs";
import { useSessions } from "@/lib/hooks/use-sessions";
import {
  activityHeatmap,
  computeStreak,
  distanceOverTime,
  muscleDistribution,
  recentActivity,
  totalDistance,
  weeklyVolume,
} from "@/lib/stats";
import { formatDate, formatPace } from "@/lib/utils";

export default function ProfileOverviewPage() {
  const params = useParams<{ id: string }>();
  const { sessions, loading: sessionsLoading } = useSessions(params.id);
  const { runs, loading: runsLoading } = useRuns(params.id);

  const streak = useMemo(() => computeStreak(sessions, runs), [sessions, runs]);
  const volume = useMemo(() => weeklyVolume(sessions), [sessions]);
  const distance = useMemo(() => distanceOverTime(runs), [runs]);
  const muscles = useMemo(() => muscleDistribution(sessions), [sessions]);
  const activity = useMemo(() => recentActivity(sessions, runs), [sessions, runs]);
  const heatmap = useMemo(() => activityHeatmap(sessions, runs), [sessions, runs]);
  const km = totalDistance(runs);

  const loading = sessionsLoading || runsLoading;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Treinos" value={sessions.length} hint="Sessões concluídas" icon="🏋️" />
        <StatTile label="Corridas" value={runs.length} hint="Registradas" icon="🏃" />
        <StatTile label="Distância" value={`${km.toFixed(1)} km`} hint="Total acumulado" icon="📍" />
        <StatTile label="Sequência" value={`${streak}d`} hint="Dias seguidos" icon="🔥" />
      </div>

      <Card className="p-5">
        <SectionLabel>Consistência</SectionLabel>
        <h3 className="mt-1 text-lg font-semibold text-white">Atividade nas últimas 16 semanas</h3>
        <div className="mt-4">
          <ActivityHeatmap weeks={heatmap} />
        </div>
      </Card>

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
                    <span className="shrink-0 text-lg">{item.type === "treino" ? "🏋️" : "🏃"}</span>
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
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Ver todos os treinos →
        </Link>
        <Link
          href={`/perfil/${params.id}/corridas`}
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Ver todas as corridas →
        </Link>
        <Link
          href={`/perfil/${params.id}/medidas`}
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Ver medidas corporais →
        </Link>
      </div>
    </div>
  );
}

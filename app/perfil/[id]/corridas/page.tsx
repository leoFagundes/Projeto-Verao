"use client";

import { Gauge, MapPin, Zap } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FaRunning } from "react-icons/fa";
import { toast } from "sonner";

import { DistanceChart } from "@/components/charts/distance-chart";
import { RunCard } from "@/components/runs/run-card";
import { RunFormModal } from "@/components/runs/run-form-modal";
import { RunShareModal } from "@/components/runs/run-share-modal";
import { Button } from "@/components/ui/button";
import { Card, SectionLabel } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatTile } from "@/components/ui/stat-tile";
import { deleteRun } from "@/lib/firebase/runs";
import { useProfile } from "@/lib/hooks/use-profile";
import { useRuns } from "@/lib/hooks/use-runs";
import { averagePace, bestPace, distanceOverTime, totalDistance } from "@/lib/stats";
import { cn, formatPace } from "@/lib/utils";
import { RUN_TYPES, type Run, type RunType } from "@/types/run";

export default function RunsPage() {
  const params = useParams<{ id: string }>();
  const { runs, loading } = useRuns(params.id);
  const { profile } = useProfile(params.id);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRun, setEditingRun] = useState<Run | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Run | null>(null);
  const [sharingRun, setSharingRun] = useState<Run | null>(null);
  const [typeFilter, setTypeFilter] = useState<RunType | "todas">("todas");

  const filteredRuns = useMemo(
    () => (typeFilter === "todas" ? runs : runs.filter((run) => run.type === typeFilter)),
    [runs, typeFilter],
  );

  const chartData = useMemo(() => distanceOverTime(filteredRuns, 12), [filteredRuns]);
  const km = totalDistance(filteredRuns);
  const avgPace = averagePace(filteredRuns);
  const best = bestPace(filteredRuns);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Corridas</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Suas corridas</h2>
        </div>
        <Button onClick={() => setFormOpen(true)}>+ Registrar</Button>
      </div>

      {runs.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTypeFilter("todas")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              typeFilter === "todas"
                ? "text-slate-950"
                : "border border-[var(--border)] text-slate-300 hover:text-white",
            )}
            style={
              typeFilter === "todas"
                ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }
                : undefined
            }
          >
            Todas
          </button>
          {RUN_TYPES.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setTypeFilter(option.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                typeFilter === option.key
                  ? "text-slate-950"
                  : "border border-[var(--border)] text-slate-300 hover:text-white",
              )}
              style={
                typeFilter === option.key
                  ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }
                  : undefined
              }
            >
              <span className="inline-flex items-center gap-1.5">
                <option.icon className="h-3.5 w-3.5" />
                {option.label}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {filteredRuns.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Corridas"
              value={filteredRuns.length}
              icon={<FaRunning className="h-4 w-4" style={{ color: "var(--accent)" }} />}
            />
            <StatTile
              label="Distância"
              value={`${km.toFixed(1)} km`}
              icon={<MapPin className="h-4 w-4" style={{ color: "var(--accent)" }} />}
            />
            <StatTile
              label="Ritmo médio"
              value={formatPace(avgPace)}
              icon={<Gauge className="h-4 w-4" style={{ color: "var(--accent)" }} />}
            />
            <StatTile
              label="Melhor ritmo"
              value={formatPace(best)}
              icon={<Zap className="h-4 w-4" style={{ color: "var(--accent)" }} />}
            />
          </div>

          <Card className="p-5">
            <SectionLabel>Evolução</SectionLabel>
            <h3 className="mt-1 text-lg font-semibold text-white">Distância ao longo do tempo</h3>
            <div className="mt-4">
              <DistanceChart data={chartData} />
            </div>
          </Card>
        </>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-white/5" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-1/3 animate-pulse rounded bg-white/5" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : runs.length === 0 ? (
        <EmptyState
          title="Nenhuma corrida registrada"
          description="Registre sua primeira corrida com km, ritmo e duração."
          action={<Button onClick={() => setFormOpen(true)}>Registrar corrida</Button>}
        />
      ) : filteredRuns.length === 0 ? (
        <EmptyState
          title="Nenhuma corrida deste tipo ainda"
          description="Mude o filtro acima ou registre uma nova corrida."
        />
      ) : (
        <Card className="p-5">
          <SectionLabel>Histórico</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-white">Corridas realizadas</h3>
          <div className="mt-4 space-y-3">
            {filteredRuns.map((run, index) => (
              <RunCard
                key={run.id}
                run={run}
                index={index}
                onEdit={() => setEditingRun(run)}
                onDelete={() => setPendingDelete(run)}
                onShare={() => setSharingRun(run)}
              />
            ))}
          </div>
        </Card>
      )}

      <RunFormModal open={formOpen} onClose={() => setFormOpen(false)} profileId={params.id} />
      <RunFormModal
        key={editingRun?.id ?? "edit-run"}
        open={editingRun !== null}
        onClose={() => setEditingRun(null)}
        profileId={params.id}
        run={editingRun}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remover corrida"
        description="Essa corrida será removida permanentemente das suas estatísticas."
        confirmLabel="Remover"
        danger
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteRun(params.id, pendingDelete.id)
            .then(() => toast.success("Corrida removida."))
            .catch(() => toast.error("Não foi possível remover."));
        }}
      />

      <RunShareModal run={sharingRun} profile={profile} open={sharingRun !== null} onClose={() => setSharingRun(null)} />
    </div>
  );
}

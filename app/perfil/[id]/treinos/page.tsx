"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { WorkoutCard } from "@/components/workouts/workout-card";
import { PerformWorkoutModal } from "@/components/workouts/perform-workout-modal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteActiveSession } from "@/lib/firebase/active-sessions";
import { useActiveSessions } from "@/lib/hooks/use-active-sessions";
import { useWorkouts } from "@/lib/hooks/use-workouts";
import { formatDateLong } from "@/lib/utils";

export default function WorkoutsPage() {
  const params = useParams<{ id: string }>();
  const { workouts, loading } = useWorkouts(params.id);
  const [search, setSearch] = useState("");
  const sortedWorkouts = useMemo(
    () => [...workouts].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [workouts],
  );
  const filteredWorkouts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query === "" ? sortedWorkouts : sortedWorkouts.filter((w) => w.name.toLowerCase().includes(query));
  }, [sortedWorkouts, search]);
  const { activeSessions } = useActiveSessions(params.id);
  const [continuingWorkoutId, setContinuingWorkoutId] = useState<string | null>(null);
  const [discardingWorkoutId, setDiscardingWorkoutId] = useState<string | null>(null);

  const continuingWorkout = workouts.find((workout) => workout.id === continuingWorkoutId) ?? null;
  const discardingSession = activeSessions.find((session) => session.workoutId === discardingWorkoutId) ?? null;

  async function handleDiscard() {
    if (!discardingWorkoutId) return;
    try {
      await deleteActiveSession(params.id, discardingWorkoutId);
      toast.success("Treino em andamento descartado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível descartar.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Treinos</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Seus planos de treino</h2>
        </div>
        <Link href={`/perfil/${params.id}/treinos/novo`}>
          <Button>+ Criar treino</Button>
        </Link>
      </div>

      {!loading && activeSessions.length > 0 ? (
        <div className="mb-6 space-y-2.5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Em andamento</p>
          {activeSessions.map((session) => {
            const doneSets = session.exercises.reduce(
              (sum, exercise) => sum + exercise.sets.filter((set) => set.done).length,
              0,
            );
            const totalSets = session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);

            return (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--accent)] bg-[var(--accent-soft)] p-4"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">{session.workoutName}</h3>
                  <p className="mt-1 text-xs text-slate-300">
                    Iniciado em {formatDateLong(session.startedAt)} · {doneSets}/{totalSets} séries
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setDiscardingWorkoutId(session.workoutId)}>
                    Descartar
                  </Button>
                  <Button size="sm" onClick={() => setContinuingWorkoutId(session.workoutId)}>
                    Continuar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {!loading && workouts.length > 1 ? (
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar treino..."
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--field-bg)] py-2.5 pl-11 pr-4 text-sm text-white outline-none focus:border-[var(--accent)]"
          />
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-white/5" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-white/5" />
                </div>
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-white/5" />
              </div>
              <div className="mt-4 h-3 w-1/2 animate-pulse rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <EmptyState
          title="Nenhum treino criado ainda"
          description="Monte seu primeiro treino com exercícios, séries e cargas."
          action={
            <Link href={`/perfil/${params.id}/treinos/novo`}>
              <Button>Criar treino</Button>
            </Link>
          }
        />
      ) : filteredWorkouts.length === 0 ? (
        <EmptyState title="Nenhum treino encontrado" description="Tente outra busca." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredWorkouts.map((workout, index) => (
            <WorkoutCard key={workout.id} workout={workout} profileId={params.id} index={index} />
          ))}
        </div>
      )}

      {continuingWorkout ? (
        <PerformWorkoutModal
          open={continuingWorkout !== null}
          onClose={() => setContinuingWorkoutId(null)}
          workout={continuingWorkout}
          profileId={params.id}
        />
      ) : null}

      <ConfirmDialog
        open={discardingSession !== null}
        title="Descartar treino em andamento?"
        description={`O progresso de "${discardingSession?.workoutName ?? ""}" será perdido definitivamente.`}
        confirmLabel="Descartar"
        danger
        onConfirm={handleDiscard}
        onClose={() => setDiscardingWorkoutId(null)}
      />
    </div>
  );
}

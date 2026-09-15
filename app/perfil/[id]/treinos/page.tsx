"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { WorkoutCard } from "@/components/workouts/workout-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useWorkouts } from "@/lib/hooks/use-workouts";

export default function WorkoutsPage() {
  const params = useParams<{ id: string }>();
  const { workouts, loading } = useWorkouts(params.id);

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

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-[24px] bg-white/5" />
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
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {workouts.map((workout, index) => (
            <WorkoutCard key={workout.id} workout={workout} profileId={params.id} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

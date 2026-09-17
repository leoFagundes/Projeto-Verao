"use client";

import { Link2 } from "lucide-react";
import NextLink from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { useProfiles } from "@/lib/hooks/use-profiles";
import { useSessions } from "@/lib/hooks/use-sessions";
import { formatDate, formatDuration } from "@/lib/utils";
import type { Workout } from "@/types/workout";

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--field-bg)] px-2 py-2.5 text-center">
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-slate-500">{label}</p>
    </div>
  );
}

/** A quick-glance card with every fact about a workout, without leaving the list —
 * exercise breakdown, history stats, and which other profiles it's linked with. */
export function WorkoutDetailsModal({
  workout,
  profileId,
  onClose,
}: {
  workout: Workout;
  profileId: string;
  onClose: () => void;
}) {
  const { sessions } = useSessions(profileId);
  const { profiles } = useProfiles();
  const workoutSessions = sessions.filter((session) => session.workoutId === workout.id);
  const activeExercises = workout.exercises.filter((exercise) => !exercise.hidden);
  const totalSets = activeExercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const linkedProfiles = workout.linkedWorkouts
    .map((ref) => profiles.find((profile) => profile.id === ref.profileId))
    .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));

  return (
    <Modal open onClose={onClose} title={workout.name}>
      <div className="grid grid-cols-3 gap-2">
        <StatBlock label="Exercícios" value={String(activeExercises.length)} />
        <StatBlock label="Séries totais" value={String(totalSets)} />
        <StatBlock label="Vezes realizado" value={String(workoutSessions.length)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>Criado em {formatDate(workout.createdAt)}</span>
        <span>
          {workout.lastPerformedAt ? `Última vez: ${formatDate(workout.lastPerformedAt)}` : "Ainda não realizado"}
        </span>
      </div>

      {linkedProfiles.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)]">
            <Link2 className="h-3.5 w-3.5" />
            Vinculado com {linkedProfiles.length === 1 ? "1 perfil" : `${linkedProfiles.length} perfis`}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {linkedProfiles.map((profile) => (
              <span
                key={profile.id}
                className="flex items-center gap-1.5 rounded-full bg-[var(--surface)] py-1 pl-1 pr-2.5 text-xs text-slate-200"
              >
                <Avatar name={profile.name} photoUrl={profile.photoUrl} className="h-5 w-5 rounded-full" textClassName="text-[9px]" />
                {profile.name}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Editar este treino pergunta se a alteração deve valer pra esses perfis também.
          </p>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Exercícios</p>
        {activeExercises.map((exercise) => (
          <div
            key={exercise.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-[var(--field-bg)] px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-white">{exercise.name}</p>
              {exercise.muscleGroup ? <p className="text-xs text-slate-500">{exercise.muscleGroup}</p> : null}
            </div>
            <span className="shrink-0 text-xs text-slate-400">
              {exercise.sets}x{exercise.measureType === "time" ? `${exercise.durationSeconds ?? "—"}s` : exercise.reps}
              {exercise.weight ? ` · ${exercise.weight}kg` : ""}
            </span>
          </div>
        ))}
      </div>

      {workoutSessions.length > 0 ? (
        <p className="mt-4 text-xs text-slate-500">
          Última sessão: {formatDate(workoutSessions[0].date)} · {formatDuration(workoutSessions[0].durationMin)}
        </p>
      ) : null}

      <NextLink
        href={`/perfil/${profileId}/treinos/${workout.id}`}
        className="mt-5 flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold text-slate-950"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
      >
        Abrir treino
      </NextLink>
    </Modal>
  );
}

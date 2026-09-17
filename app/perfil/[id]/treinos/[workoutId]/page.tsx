"use client";

import { Link2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ExerciseProgressionChart } from "@/components/charts/exercise-progression-chart";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, SectionLabel } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CopyWorkoutModal } from "@/components/workouts/copy-workout-modal";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import { LinkEditChoiceModal } from "@/components/workouts/link-edit-choice-modal";
import { PerformWorkoutModal } from "@/components/workouts/perform-workout-modal";
import { SessionHistoryList } from "@/components/workouts/session-history-list";
import { WorkoutChangeNoteBanner } from "@/components/workouts/workout-change-note-banner";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { deleteWorkout, propagateWorkoutEdit, setExerciseHidden, updateWorkout, updateWorkoutAndUnlink } from "@/lib/firebase/workouts";
import { useProfile } from "@/lib/hooks/use-profile";
import { useProfiles } from "@/lib/hooks/use-profiles";
import { useSessions } from "@/lib/hooks/use-sessions";
import { useWorkouts } from "@/lib/hooks/use-workouts";
import {
  bestDurationForExercise,
  bestWeightForExercise,
  exerciseDurationProgression,
  exerciseProgression,
} from "@/lib/stats";
import { formatClock, formatDate } from "@/lib/utils";
import type { PersonalExerciseField } from "@/lib/workout-sync";
import type { Exercise, WorkoutInput } from "@/types/workout";

export default function WorkoutDetailPage() {
  const params = useParams<{ id: string; workoutId: string }>();
  const router = useRouter();
  const { workouts, loading } = useWorkouts(params.id);
  const { sessions } = useSessions(params.id);
  const { profiles } = useProfiles();
  const { profile } = useProfile(params.id);

  const [editing, setEditing] = useState(false);
  const [performOpen, setPerformOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [viewingImages, setViewingImages] = useState<Exercise | null>(null);
  const [viewingVideoUrl, setViewingVideoUrl] = useState<string | null>(null);
  const [pendingEdit, setPendingEdit] = useState<WorkoutInput | null>(null);

  const workout = useMemo(
    () => workouts.find((item) => item.id === params.workoutId) ?? null,
    [workouts, params.workoutId],
  );

  const workoutSessions = useMemo(
    () => sessions.filter((session) => session.workoutId === params.workoutId),
    [sessions, params.workoutId],
  );

  const visibleExercises = workout?.exercises.filter((exercise) => !exercise.hidden) ?? [];
  const hiddenExercises = workout?.exercises.filter((exercise) => exercise.hidden) ?? [];

  async function handleUpdate(values: WorkoutInput) {
    if (workout && workout.linkedWorkouts.length > 0) {
      setPendingEdit(values);
      return;
    }
    try {
      await updateWorkout(params.id, params.workoutId, values);
      toast.success("Treino atualizado!");
      setEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  }

  async function handleSync(syncFields: Set<PersonalExerciseField>) {
    if (!workout || !pendingEdit) return;
    try {
      await propagateWorkoutEdit(params.id, params.workoutId, pendingEdit, workout.linkedWorkouts, syncFields, {
        profileId: params.id,
        name: profile?.name ?? "Alguém",
      });
      toast.success("Treino atualizado e sincronizado com os perfis vinculados!");
      setPendingEdit(null);
      setEditing(false);
    } catch {
      toast.error("Não foi possível sincronizar com todos os perfis vinculados.");
    }
  }

  async function handleUnlinkAndSave() {
    if (!workout || !pendingEdit) return;
    try {
      await updateWorkoutAndUnlink(params.id, params.workoutId, pendingEdit, workout.linkedWorkouts);
      toast.success("Treino atualizado só neste perfil — vínculo desfeito.");
      setPendingEdit(null);
      setEditing(false);
    } catch {
      toast.error("Não foi possível atualizar o treino.");
    }
  }

  async function handleToggleHidden(exercise: Exercise) {
    if (!workout) return;
    try {
      await setExerciseHidden(params.id, params.workoutId, workout, exercise.id, !exercise.hidden);
    } catch {
      toast.error("Não foi possível atualizar o exercício.");
    }
  }


  if (loading) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-white/5" />;
  }

  if (!workout) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-300">Treino não encontrado.</p>
      </Card>
    );
  }

  if (editing) {
    const linkedProfiles = workout.linkedWorkouts
      .map((ref) => profiles.find((profile) => profile.id === ref.profileId))
      .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));

    return (
      <div>
        <SectionLabel>Editar treino</SectionLabel>
        <h2 className="mt-2 text-2xl font-semibold text-white">{workout.name}</h2>

        {linkedProfiles.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-2.5 text-xs text-slate-200">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
            <span className="font-medium text-[var(--accent)]">Vinculado com:</span>
            {linkedProfiles.map((profile) => (
              <span key={profile.id} className="flex items-center gap-1 rounded-full bg-[var(--surface)] py-0.5 pl-0.5 pr-2 text-xs">
                <Avatar name={profile.name} photoUrl={profile.photoUrl} className="h-4 w-4 rounded-full" textClassName="text-[8px]" />
                {profile.name}
              </span>
            ))}
            <span className="text-slate-400">— exercícios e ordem sincronizam sempre; carga, reps etc. você escolhe ao salvar.</span>
          </div>
        ) : null}

        <Card className="mt-4 p-5 sm:p-6">
          <WorkoutForm
            initialValues={{ name: workout.name, category: workout.category, exercises: workout.exercises }}
            submitLabel="Salvar alterações"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
          />
        </Card>

        <LinkEditChoiceModal
          open={pendingEdit !== null}
          workoutId={params.workoutId}
          linkedProfiles={linkedProfiles}
          onClose={() => setPendingEdit(null)}
          onSync={handleSync}
          onUnlinkAndSave={handleUnlinkAndSave}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {workout.pendingChangeNote ? (
        <WorkoutChangeNoteBanner profileId={params.id} workoutId={workout.id} note={workout.pendingChangeNote} />
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionLabel>Treino</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{workout.name}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {workout.lastPerformedAt
              ? `Última vez: ${formatDate(workout.lastPerformedAt)}`
              : "Ainda não realizado"}
          </p>
          {workout.linkedWorkouts.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent)]">
                <Link2 className="h-3.5 w-3.5" />
                Vinculado com:
              </span>
              {workout.linkedWorkouts.map((ref) => {
                const linkedProfile = profiles.find((profile) => profile.id === ref.profileId);
                if (!linkedProfile) return null;
                return (
                  <span
                    key={ref.profileId}
                    className="flex items-center gap-1 rounded-full bg-[var(--surface-2)] py-0.5 pl-0.5 pr-2 text-xs text-slate-200"
                  >
                    <Avatar name={linkedProfile.name} photoUrl={linkedProfile.photoUrl} className="h-4 w-4 rounded-full" textClassName="text-[8px]" />
                    {linkedProfile.name}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setPerformOpen(true)}>Realizar treino</Button>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <Button variant="secondary" onClick={() => setCopyOpen(true)}>
            Copiar
          </Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Excluir
          </Button>
        </div>
      </div>

      <Card className="p-5">
        <SectionLabel>Exercícios</SectionLabel>
        <div className="mt-4 space-y-3">
          {visibleExercises.length === 0 ? (
            <p className="text-sm text-slate-500">
              {hiddenExercises.length > 0
                ? "Todos os exercícios deste treino estão ocultos."
                : "Nenhum exercício neste treino."}
            </p>
          ) : null}
          {visibleExercises.map((exercise) => {
            const isTimeBased = exercise.measureType === "time";
            const progression = isTimeBased
              ? exerciseDurationProgression(sessions, exercise.exerciseId).map((p) => ({
                  date: p.date,
                  value: p.seconds,
                }))
              : exerciseProgression(sessions, exercise.exerciseId).map((p) => ({
                  date: p.date,
                  value: p.weight,
                }));
            const latest = progression[progression.length - 1] ?? null;
            const previous = progression[progression.length - 2] ?? null;
            const delta = latest && previous ? latest.value - previous.value : null;
            const best = isTimeBased
              ? bestDurationForExercise(sessions, exercise.exerciseId)
              : bestWeightForExercise(sessions, exercise.exerciseId);

            return (
              <div
                key={exercise.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
              >
                <div className="flex gap-4">
                  {exercise.images.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setViewingImages(exercise)}
                      className="relative shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={exercise.images[0]}
                        alt={exercise.name}
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                      {exercise.images.length > 1 ? (
                        <span className="absolute bottom-1 right-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white">
                          +{exercise.images.length - 1}
                        </span>
                      ) : null}
                    </button>
                  ) : (
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-[var(--surface)] text-xl">
                      🏋️
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-medium text-white">{exercise.name}</h3>
                      <div className="flex items-center gap-2">
                        {exercise.muscleGroup ? (
                          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-[var(--accent)]">
                            {exercise.muscleGroup}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleToggleHidden(exercise)}
                          className="text-xs text-slate-500 hover:text-white"
                          title="Ocultar exercício"
                        >
                          Ocultar
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {isTimeBased
                        ? `${exercise.sets}x${exercise.durationSeconds ?? "—"}s`
                        : `${exercise.sets}x${exercise.reps}`}
                      {exercise.weight ? ` · alvo ${exercise.weight}kg` : ""}
                      {exercise.restSeconds ? ` · ${exercise.restSeconds}s descanso` : ""}
                    </p>
                    {exercise.linkedToNext ? (
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">
                        🔗 Superserie com o próximo
                      </p>
                    ) : null}
                    {exercise.videoUrl ? (
                      <button
                        type="button"
                        onClick={() => setViewingVideoUrl(exercise.videoUrl)}
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        ▶ Ver vídeo de como fazer
                      </button>
                    ) : null}
                    {exercise.notes ? (
                      <p className="mt-1 text-xs text-slate-500">{exercise.notes}</p>
                    ) : null}
                    {latest ? (
                      <p className="mt-2 text-sm font-medium text-white">
                        {isTimeBased ? "Última marca: " : "Última carga: "}
                        {isTimeBased ? formatClock(latest.value) : `${latest.value}kg`}
                        {delta != null && delta !== 0 ? (
                          <span className={delta > 0 ? "text-emerald-400" : "text-red-300"}>
                            {" "}
                            ({delta > 0 ? "+" : ""}
                            {isTimeBased ? `${delta}s` : `${delta}kg`})
                          </span>
                        ) : null}
                        {best != null ? (
                          <span className="ml-2 text-amber-400">
                            🏆 {isTimeBased ? formatClock(best) : `${best}kg`}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                </div>

                {progression.length >= 2 ? (
                  <div className="mt-3">
                    <ExerciseProgressionChart data={progression} unit={isTimeBased ? "s" : "kg"} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {hiddenExercises.length > 0 ? (
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Ocultos ({hiddenExercises.length})
            </p>
            <div className="mt-3 space-y-2">
              {hiddenExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 opacity-60"
                >
                  <span className="truncate text-sm text-slate-300">{exercise.name}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleHidden(exercise)}
                    className="shrink-0 text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    Mostrar
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="p-5">
        <SectionLabel>Histórico</SectionLabel>
        <h3 className="mt-1 text-lg font-semibold text-white">Sessões realizadas</h3>
        <div className="mt-4">
          <SessionHistoryList profileId={params.id} profile={profile} sessions={workoutSessions} />
        </div>
      </Card>

      <PerformWorkoutModal
        open={performOpen}
        onClose={() => setPerformOpen(false)}
        workout={workout}
        profileId={params.id}
      />

      <ImageLightbox
        images={viewingImages?.images ?? []}
        open={viewingImages !== null}
        onClose={() => setViewingImages(null)}
      />

      <VideoLightbox
        url={viewingVideoUrl}
        open={viewingVideoUrl !== null}
        onClose={() => setViewingVideoUrl(null)}
      />

      <CopyWorkoutModal
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
        profileId={params.id}
        workout={workout}
        onCopied={(targetProfileId, newWorkoutId) => {
          if (targetProfileId === params.id) {
            router.push(`/perfil/${targetProfileId}/treinos/${newWorkoutId}`);
          }
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir treino"
        description="Esse treino será removido permanentemente. O histórico de sessões já realizadas continuará nas estatísticas."
        confirmLabel="Excluir"
        danger
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!workout) return;
          deleteWorkout(params.id, workout)
            .then(() => {
              toast.success("Treino excluído.");
              router.push(`/perfil/${params.id}/treinos`);
            })
            .catch(() => toast.error("Não foi possível excluir o treino."));
        }}
      />
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Modal } from "@/components/ui/modal";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import { deleteActiveSession, saveActiveSession } from "@/lib/firebase/active-sessions";
import { createSession } from "@/lib/firebase/sessions";
import { useActiveSessions } from "@/lib/hooks/use-active-sessions";
import { useSessions } from "@/lib/hooks/use-sessions";
import { detectNewRecords, lastWeightForExercise } from "@/lib/stats";
import { cn, formatDateInput, parseDateInput } from "@/lib/utils";
import type { SessionExerciseLog, SetLog, WorkoutSession } from "@/types/session";
import type { Workout } from "@/types/workout";

import { RestTimer } from "./rest-timer";

const TIMER_PREF_KEY = "projeto-verao-rest-timer-enabled";
const AUTOSAVE_DELAY_MS = 900;

function visibleExercises(workout: Workout) {
  return workout.exercises.filter((exercise) => !exercise.hidden);
}

function buildInitialLogs(workout: Workout, sessions: WorkoutSession[]): SessionExerciseLog[] {
  return visibleExercises(workout).map((exercise) => {
    const lastWeight = lastWeightForExercise(sessions, exercise.exerciseId);
    const weight = lastWeight ?? exercise.weight;
    const sets: SetLog[] = Array.from({ length: Math.max(exercise.sets, 1) }, () => ({
      reps: exercise.reps,
      weight,
      done: false,
    }));

    return {
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets,
    };
  });
}

function isComplete(log: SessionExerciseLog) {
  return log.sets.length > 0 && log.sets.every((set) => set.done);
}

function hasProgress(exerciseLogs: SessionExerciseLog[], durationMin: number, note: string) {
  return (
    note.trim() !== "" ||
    durationMin !== 45 ||
    exerciseLogs.some((log) => log.sets.some((set) => set.done))
  );
}

export function PerformWorkoutModal({
  open,
  onClose,
  workout,
  profileId,
}: {
  open: boolean;
  onClose: () => void;
  workout: Workout;
  profileId: string;
}) {
  const { sessions } = useSessions(profileId);
  const { activeSessions } = useActiveSessions(profileId);
  const draft = activeSessions.find((item) => item.workoutId === workout.id) ?? null;

  const [date, setDate] = useState(() => formatDateInput(Date.now()));
  const [durationMin, setDurationMin] = useState(45);
  const [note, setNote] = useState("");
  const [exerciseLogs, setExerciseLogs] = useState<SessionExerciseLog[]>(() =>
    buildInitialLogs(workout, sessions),
  );
  const [expandedId, setExpandedId] = useState<string | null>(visibleExercises(workout)[0]?.id ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [resting, setResting] = useState<{ key: number; seconds: number } | null>(null);
  const restKeyRef = useRef(0);
  const [viewingImagesFor, setViewingImagesFor] = useState<string | null>(null);
  const [viewingVideoUrl, setViewingVideoUrl] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    // Browser-only preference, can't be read during render (SSR has no
    // localStorage) — an effect is the correct place for a one-time read.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimerEnabled(localStorage.getItem(TIMER_PREF_KEY) !== "false");
  }, []);

  function toggleTimerEnabled() {
    setTimerEnabled((current) => {
      const next = !current;
      localStorage.setItem(TIMER_PREF_KEY, String(next));
      return next;
    });
  }

  useEffect(() => {
    // Re-roll the form fresh every time the modal opens — resuming a saved
    // draft if one exists for this workout, otherwise today's date, target
    // sets/reps and the last logged weight per exercise. Needs Date.now()
    // and the latest sessions/draft, so it can't be computed during render.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open) return;
    if (draft) {
      setDate(formatDateInput(draft.date));
      setDurationMin(draft.durationMin);
      setNote(draft.note);
      setExerciseLogs(draft.exercises);
      startedAtRef.current = draft.startedAt;
      setExpandedId(draft.exercises.find((log) => !isComplete(log))?.id ?? null);
    } else {
      setDate(formatDateInput(Date.now()));
      setDurationMin(45);
      setNote("");
      setExerciseLogs(buildInitialLogs(workout, sessions));
      startedAtRef.current = Date.now();
      setExpandedId(visibleExercises(workout)[0]?.id ?? null);
    }
    setResting(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only re-rolls on open, using latest workout/sessions/draft closures
  }, [open]);

  useEffect(() => {
    if (!open || !hasProgress(exerciseLogs, durationMin, note)) return;

    const timeout = setTimeout(() => {
      saveActiveSession(profileId, {
        workoutId: workout.id,
        workoutName: workout.name,
        date: parseDateInput(date),
        durationMin,
        note: note.trim(),
        exercises: exerciseLogs,
        startedAt: startedAtRef.current,
      }).catch(() => {
        // Best-effort autosave — a failed save just means we retry on the
        // next change, no need to interrupt the workout with an error toast.
      });
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [open, profileId, workout.id, workout.name, date, durationMin, note, exerciseLogs]);

  function toggleExpanded(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  function updateSet(exerciseId: string, setIndex: number, patch: Partial<SetLog>) {
    const next = exerciseLogs.map((log) =>
      log.id === exerciseId
        ? { ...log, sets: log.sets.map((set, index) => (index === setIndex ? { ...set, ...patch } : set)) }
        : log,
    );
    setExerciseLogs(next);

    const updated = next.find((log) => log.id === exerciseId);
    if (updated && isComplete(updated)) {
      setExpandedId((current) => (current === exerciseId ? null : current));
    }

    if (patch.done === true && timerEnabled) {
      const restSeconds = workout.exercises.find((exercise) => exercise.id === exerciseId)?.restSeconds;
      if (restSeconds) {
        restKeyRef.current += 1;
        setResting({ key: restKeyRef.current, seconds: restSeconds });
      }
    }
  }

  function addSet(exerciseId: string) {
    setExerciseLogs((current) =>
      current.map((log) => {
        if (log.id !== exerciseId) return log;
        const last = log.sets[log.sets.length - 1];
        return {
          ...log,
          sets: [...log.sets, { reps: last?.reps ?? "", weight: last?.weight ?? null, done: false }],
        };
      }),
    );
  }

  function removeSet(exerciseId: string, setIndex: number) {
    setExerciseLogs((current) =>
      current.map((log) =>
        log.id === exerciseId
          ? { ...log, sets: log.sets.filter((_, index) => index !== setIndex) }
          : log,
      ),
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const records = detectNewRecords(sessions, exerciseLogs);

      await createSession(profileId, {
        workoutId: workout.id,
        workoutName: workout.name,
        date: parseDateInput(date),
        durationMin,
        note: note.trim(),
        exercises: exerciseLogs,
      });
      await deleteActiveSession(profileId, workout.id).catch(() => {});
      toast.success("Treino registrado!");
      for (const record of records) {
        toast.success(`🏆 Novo recorde: ${record.name} — ${record.weight}kg!`, { duration: 5000 });
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetWorkout() {
    setDate(formatDateInput(Date.now()));
    setDurationMin(45);
    setNote("");
    setExerciseLogs(buildInitialLogs(workout, sessions));
    setExpandedId(visibleExercises(workout)[0]?.id ?? null);
    setResting(null);
    startedAtRef.current = Date.now();
    deleteActiveSession(profileId, workout.id).catch(() => {});
    toast.success("Treino reiniciado.");
  }

  const progressInProgress = hasProgress(exerciseLogs, durationMin, note);

  return (
    <Modal open={open} onClose={onClose} title={`Realizar: ${workout.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {draft ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-2.5 text-xs text-slate-200">
            <span>Continuando um treino que você já tinha começado.</span>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="shrink-0 font-medium text-[var(--accent)] hover:underline"
            >
              ↺ Reiniciar
            </button>
          </div>
        ) : progressInProgress ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-xs font-medium text-slate-400 hover:text-white"
            >
              ↺ Reiniciar treino
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Data">
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </Field>
          <Field label="Duração (min)">
            <Input
              type="number"
              min={1}
              value={durationMin}
              onChange={(event) => setDurationMin(Number(event.target.value) || 0)}
            />
          </Field>
        </div>

        <button
          type="button"
          onClick={toggleTimerEnabled}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3"
        >
          <span className="text-sm text-slate-300">Timer de descanso</span>
          <span
            role="switch"
            aria-checked={timerEnabled}
            className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200"
            style={{ backgroundColor: timerEnabled ? "var(--accent)" : "var(--field-bg)" }}
          >
            <span
              aria-hidden="true"
              className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: timerEnabled ? "translateX(22px)" : "translateX(2px)" }}
            />
          </span>
        </button>

        <AnimatePresence>
          {resting ? (
            <RestTimer
              key={resting.key}
              seconds={resting.seconds}
              onComplete={() => setResting(null)}
              onSkip={() => setResting(null)}
            />
          ) : null}
        </AnimatePresence>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {exerciseLogs.length === 0 ? (
            <p className="text-sm text-slate-500">
              Todos os exercícios deste treino estão ocultos no momento.
            </p>
          ) : null}
          {exerciseLogs.map((log) => {
            const expanded = expandedId === log.id;
            const complete = isComplete(log);
            const doneCount = log.sets.filter((set) => set.done).length;
            const source = workout.exercises.find((exercise) => exercise.id === log.id);

            return (
              <div
                key={log.id}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]"
              >
                <div className="flex w-full items-center gap-3 p-3">
                  {source && source.images.length > 0 ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setViewingImagesFor(log.id);
                      }}
                      className="shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={source.images[0]}
                        alt={log.name}
                        className="h-11 w-11 rounded-xl object-cover"
                      />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => toggleExpanded(log.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className={cn(
                        "shrink-0 text-xs text-slate-500 transition-transform",
                        expanded ? "rotate-90" : "",
                      )}
                    >
                      ▸
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{log.name}</p>
                      {log.muscleGroup ? <p className="text-xs text-slate-400">{log.muscleGroup}</p> : null}
                    </div>
                    {complete ? (
                      <span className="shrink-0 rounded-full border border-[var(--accent)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">
                        Concluído
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs text-slate-400">
                        {doneCount}/{log.sets.length} séries
                      </span>
                    )}
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 px-3 pb-3">
                        {source?.videoUrl ? (
                          <button
                            type="button"
                            onClick={() => setViewingVideoUrl(source.videoUrl)}
                            className="inline-block text-xs text-[var(--accent)] hover:underline"
                          >
                            ▶ Ver vídeo de como fazer
                          </button>
                        ) : null}

                        <div className="space-y-2">
                          <div className="grid grid-cols-[1.75rem_1fr_1fr_2.25rem_1.5rem] items-center gap-2 px-1 text-[10px] uppercase tracking-[0.15em] text-slate-500">
                            <span />
                            <span>Reps</span>
                            <span>Carga (kg)</span>
                            <span className="text-center">OK</span>
                            <span />
                          </div>
                          {log.sets.map((set, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-[1.75rem_1fr_1fr_2.25rem_1.5rem] items-center gap-2"
                            >
                              <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--surface)] text-xs font-medium text-slate-300">
                                {index + 1}
                              </span>
                              <input
                                value={set.reps}
                                onChange={(event) => updateSet(log.id, index, { reps: event.target.value })}
                                placeholder="Reps"
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--field-bg)] px-2 py-2 text-center text-sm text-white outline-none focus:border-[var(--accent)]"
                              />
                              <input
                                type="number"
                                step="0.5"
                                value={set.weight ?? ""}
                                onChange={(event) =>
                                  updateSet(log.id, index, {
                                    weight: event.target.value === "" ? null : Number(event.target.value),
                                  })
                                }
                                placeholder="Kg"
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--field-bg)] px-2 py-2 text-center text-sm text-white outline-none focus:border-[var(--accent)]"
                              />
                              <button
                                type="button"
                                onClick={() => updateSet(log.id, index, { done: !set.done })}
                                aria-pressed={set.done}
                                aria-label={set.done ? "Marcar série como não concluída" : "Marcar série como concluída"}
                                className="grid h-7 w-7 place-items-center justify-self-center rounded-full border-2 text-sm font-bold transition"
                                style={
                                  set.done
                                    ? { borderColor: "var(--accent)", backgroundColor: "var(--accent)", color: "var(--bg)" }
                                    : { borderColor: "var(--border-strong)", color: "transparent" }
                                }
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => removeSet(log.id, index)}
                                className="justify-self-center text-sm text-slate-500 hover:text-red-300"
                                aria-label="Remover série"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => addSet(log.id)}
                          className="text-xs font-medium text-[var(--accent)] hover:underline"
                        >
                          + Adicionar série
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <Field label="Nota (opcional)">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Como foi o treino?"
          />
        </Field>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Salvando..." : "Concluir treino"}
        </Button>
      </form>

      <ImageLightbox
        images={workout.exercises.find((exercise) => exercise.id === viewingImagesFor)?.images ?? []}
        open={viewingImagesFor !== null}
        onClose={() => setViewingImagesFor(null)}
      />

      <VideoLightbox
        url={viewingVideoUrl}
        open={viewingVideoUrl !== null}
        onClose={() => setViewingVideoUrl(null)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reiniciar treino?"
        description="Isso apaga o progresso atual (séries marcadas, cargas e nota) e começa do zero."
        confirmLabel="Reiniciar"
        danger
        onClose={() => setConfirmReset(false)}
        onConfirm={resetWorkout}
      />
    </Modal>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { createSession } from "@/lib/firebase/sessions";
import { useSessions } from "@/lib/hooks/use-sessions";
import { detectNewRecords, lastWeightForExercise } from "@/lib/stats";
import { cn, formatDateInput, parseDateInput } from "@/lib/utils";
import type { SessionExerciseLog, SetLog, WorkoutSession } from "@/types/session";
import type { Workout } from "@/types/workout";

import { RestTimer } from "./rest-timer";

const TIMER_PREF_KEY = "projeto-verao-rest-timer-enabled";

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
    // Re-roll the form fresh every time the modal opens (today's date, target
    // sets/reps, last logged weight per exercise) — needs Date.now() and the
    // latest sessions, so it can't be computed purely during render.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open) return;
    setDate(formatDateInput(Date.now()));
    setDurationMin(45);
    setNote("");
    setExerciseLogs(buildInitialLogs(workout, sessions));
    setExpandedId(visibleExercises(workout)[0]?.id ?? null);
    setResting(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only re-rolls on open, using latest workout/sessions closures
  }, [open]);

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

  return (
    <Modal open={open} onClose={onClose} title={`Realizar: ${workout.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5"
        >
          <span className="text-sm text-slate-300">Timer de descanso</span>
          <span
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors",
              timerEnabled ? "bg-[var(--accent)]" : "bg-[var(--field-bg)]",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                timerEnabled ? "translate-x-[18px]" : "translate-x-0.5",
              )}
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

            return (
              <div
                key={log.id}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]"
              >
                <button
                  type="button"
                  onClick={() => toggleExpanded(log.id)}
                  className="flex w-full items-center gap-3 p-3 text-left"
                >
                  <span
                    className={cn(
                      "text-xs text-slate-500 transition-transform",
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

                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 px-3 pb-3">
                        <div className="grid grid-cols-[1.4rem_1fr_1fr_1.5rem_1.25rem] items-center gap-2 px-1 text-[10px] uppercase tracking-[0.15em] text-slate-500">
                          <span>Série</span>
                          <span>Reps</span>
                          <span>Carga (kg)</span>
                          <span className="text-center">OK</span>
                          <span />
                        </div>
                        {log.sets.map((set, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-[1.4rem_1fr_1fr_1.5rem_1.25rem] items-center gap-2"
                          >
                            <span className="text-center text-xs text-slate-400">{index + 1}</span>
                            <input
                              value={set.reps}
                              onChange={(event) => updateSet(log.id, index, { reps: event.target.value })}
                              className="w-full rounded-xl border border-[var(--border)] bg-[var(--field-bg)] px-2 py-1.5 text-center text-sm text-white outline-none focus:border-[var(--accent)]"
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
                              placeholder="kg"
                              className="w-full rounded-xl border border-[var(--border)] bg-[var(--field-bg)] px-2 py-1.5 text-center text-sm text-white outline-none focus:border-[var(--accent)]"
                            />
                            <input
                              type="checkbox"
                              checked={set.done}
                              onChange={(event) => updateSet(log.id, index, { done: event.target.checked })}
                              className="mx-auto h-4 w-4 accent-[var(--accent)]"
                            />
                            <button
                              type="button"
                              onClick={() => removeSet(log.id, index)}
                              className="text-sm text-slate-500 hover:text-red-300"
                              aria-label="Remover série"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
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
    </Modal>
  );
}

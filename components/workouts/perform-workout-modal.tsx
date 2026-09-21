"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, Clock, Info, Link2, Play, RotateCcw, Trophy, X } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AchievementUnlockModal } from "@/components/achievements/achievement-unlock-modal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Modal } from "@/components/ui/modal";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import { type Achievement, detectNewlyUnlocked } from "@/lib/achievements";
import { deleteActiveSession, saveActiveSession } from "@/lib/firebase/active-sessions";
import { createSession } from "@/lib/firebase/sessions";
import { useActiveSessions } from "@/lib/hooks/use-active-sessions";
import { useExercises } from "@/lib/hooks/use-exercises";
import { useMeasurements } from "@/lib/hooks/use-measurements";
import { useProfiles } from "@/lib/hooks/use-profiles";
import { useRuns } from "@/lib/hooks/use-runs";
import { useSessions } from "@/lib/hooks/use-sessions";
import { playSound } from "@/lib/sound";
import { detectNewRecords, lastDurationForExercise, lastRepsForExercise, lastWeightForExercise } from "@/lib/stats";
import { cn, formatClock, formatDateInput, parseDateInput } from "@/lib/utils";
import type { SessionExerciseLog, SetLog, WorkoutSession } from "@/types/session";
import type { Workout } from "@/types/workout";

import { ExerciseInfoModal } from "./exercise-info-modal";
import { RestTimer } from "./rest-timer";
import { SetTimerModal } from "./set-timer-modal";

const TIMER_PREF_KEY = "projeto-verao-rest-timer-enabled";
const AUTOSAVE_DELAY_MS = 900;

function visibleExercises(workout: Workout) {
  return workout.exercises.filter((exercise) => !exercise.hidden);
}

function buildInitialLogs(workout: Workout, sessions: WorkoutSession[]): SessionExerciseLog[] {
  // Only carry over weight/reps/duration from sessions of THIS workout — the
  // same catalog exercise can appear in more than one workout plan, and what
  // you lifted in one shouldn't bleed into another's prefill as if it were
  // one single global "exercise" state.
  const workoutSessions = sessions.filter((session) => session.workoutId === workout.id);

  return visibleExercises(workout).map((exercise) => {
    const lastWeight = lastWeightForExercise(workoutSessions, exercise.exerciseId);
    const weight = exercise.trackWeight ? lastWeight ?? exercise.weight : null;
    const lastDuration = lastDurationForExercise(workoutSessions, exercise.exerciseId);
    // Same convention as weight: prefill with the last time actually held, or
    // fall back to the plan's target — editable either way before marking done.
    const durationSeconds = exercise.measureType === "time" ? lastDuration ?? exercise.durationSeconds ?? 0 : null;
    // Same idea again for reps — remember what was actually typed last time
    // instead of always resetting to the plan's static target.
    const reps = lastRepsForExercise(workoutSessions, exercise.exerciseId) ?? exercise.reps;
    const sets: SetLog[] = Array.from({ length: Math.max(exercise.sets, 1) }, () => ({
      reps,
      weight,
      durationSeconds,
      done: false,
    }));

    return {
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets,
      notes: "",
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
  const { runs } = useRuns(profileId);
  const { measurements } = useMeasurements(profileId);
  const { activeSessions, loading: draftLoading } = useActiveSessions(profileId);
  const { exercises: exerciseDefs } = useExercises();
  const { profiles } = useProfiles();
  const shareableProfiles = profiles.filter(
    (profile) => profile.id !== profileId && profile.allowSharedWorkouts,
  );
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
  const [resting, setResting] = useState<{ key: number; seconds: number; resetToken: number } | null>(null);
  const restKeyRef = useRef(0);
  const restResetTokenRef = useRef(0);
  const [viewingImagesFor, setViewingImagesFor] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState<Achievement[]>([]);
  const [viewingVideoUrl, setViewingVideoUrl] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [step, setStep] = useState<"exercises" | "summary">("exercises");
  const [viewingInfoFor, setViewingInfoFor] = useState<string | null>(null);
  const [shareWithProfileIds, setShareWithProfileIds] = useState<string[]>([]);
  const [activeTimer, setActiveTimer] = useState<{ logId: string; setIndex: number } | null>(null);
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
    // Also waits for the active-session subscription to finish its first
    // load: when this modal mounts fresh (e.g. from the "Continuar" button,
    // which only renders it once a draft is picked), `activeSessions` starts
    // out empty until Firestore responds — seeding immediately would build a
    // blank form and never re-seed once the real draft arrives, making the
    // in-progress workout look lost even though it's still saved.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open || draftLoading) return;
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
    setStep("exercises");
    setShareWithProfileIds([]);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only re-rolls on open/draftLoading, using latest workout/sessions/draft closures
  }, [open, draftLoading]);

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
    const before = exerciseLogs.find((log) => log.id === exerciseId);
    const wasComplete = before ? isComplete(before) : false;

    const next = exerciseLogs.map((log) =>
      log.id === exerciseId
        ? { ...log, sets: log.sets.map((set, index) => (index === setIndex ? { ...set, ...patch } : set)) }
        : log,
    );
    setExerciseLogs(next);

    const source = workout.exercises.find((exercise) => exercise.id === exerciseId);
    const updated = next.find((log) => log.id === exerciseId);

    // Only auto-advance/collapse on the transition into "complete" — editing
    // weight/reps on an already-complete exercise shouldn't re-trigger this.
    if (updated && !wasComplete && isComplete(updated)) {
      if (source?.linkedToNext) {
        // Part of a superset — jump straight to the next exercise in the circuit.
        const currentIndex = next.findIndex((log) => log.id === exerciseId);
        setExpandedId(next[currentIndex + 1]?.id ?? null);
      } else {
        setExpandedId((current) => (current === exerciseId ? null : current));
      }
    }

    // Superset exercises share one rest period, taken only after the last one in the chain.
    if (patch.done === true && timerEnabled && !source?.linkedToNext) {
      const restSeconds = source?.restSeconds;
      if (restSeconds) {
        restResetTokenRef.current += 1;
        setResting((current) => {
          // If a rest is already counting down, just restart it in place
          // instead of swapping the key — swapping remounts the timer and
          // replays its exit/enter animation on every consecutive "OK".
          if (current) return { ...current, seconds: restSeconds, resetToken: restResetTokenRef.current };
          restKeyRef.current += 1;
          return { key: restKeyRef.current, seconds: restSeconds, resetToken: restResetTokenRef.current };
        });
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
          sets: [
            ...log.sets,
            {
              reps: last?.reps ?? "",
              weight: last?.weight ?? null,
              durationSeconds: last?.durationSeconds ?? null,
              done: false,
            },
          ],
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

  function updateExerciseNote(exerciseId: string, notes: string) {
    setExerciseLogs((current) => current.map((log) => (log.id === exerciseId ? { ...log, notes } : log)));
  }

  function goToSummary() {
    // Auto-fills the duration from real elapsed time so most people never
    // have to type it in — still editable on the summary screen, and going
    // back to exercises and hitting "Continuar" again just recalculates it.
    const minutes = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 60000));
    setDurationMin(minutes);
    setStep("summary");
  }

  function toggleShareProfile(profileId: string) {
    setShareWithProfileIds((current) =>
      current.includes(profileId) ? current.filter((id) => id !== profileId) : [...current, profileId],
    );
  }

  function completeAllSets(exerciseId: string) {
    setExerciseLogs((current) => current.map((log) =>
      log.id === exerciseId ? { ...log, sets: log.sets.map((set) => ({ ...set, done: true })) } : log,
    ));

    const source = workout.exercises.find((exercise) => exercise.id === exerciseId);
    if (source?.linkedToNext) {
      const currentIndex = exerciseLogs.findIndex((log) => log.id === exerciseId);
      setExpandedId(exerciseLogs[currentIndex + 1]?.id ?? null);
    } else {
      setExpandedId((current) => (current === exerciseId ? null : current));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const records = detectNewRecords(sessions, exerciseLogs);

      const sessionInput: WorkoutSession = {
        id: "pending",
        workoutId: workout.id,
        workoutName: workout.name,
        date: parseDateInput(date),
        durationMin,
        note: note.trim(),
        exercises: exerciseLogs,
        createdAt: Date.now(),
        sharedByName: null,
      };
      const newlyUnlocked = detectNewlyUnlocked(
        { sessions, runs, measurements },
        { sessions: [...sessions, sessionInput], runs, measurements },
      );

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
        const value = record.weight != null ? `${record.weight}kg` : formatClock(record.seconds ?? 0);
        toast.success(`Novo recorde: ${record.name} — ${value}!`, {
          duration: 5000,
          icon: <Trophy className="h-4 w-4" />,
        });
      }

      if (shareWithProfileIds.length > 0) {
        const myName = profiles.find((profile) => profile.id === profileId)?.name ?? "Alguém";
        const sharedNames: string[] = [];
        for (const targetProfileId of shareWithProfileIds) {
          try {
            // No `workoutId` on purpose — the target profile doesn't necessarily
            // have this workout plan, only the completed log, which is all
            // that stats/achievements/history need.
            await createSession(targetProfileId, {
              workoutId: null,
              workoutName: workout.name,
              date: parseDateInput(date),
              durationMin,
              note: note.trim(),
              exercises: exerciseLogs,
              sharedByName: myName,
            });
            sharedNames.push(profiles.find((profile) => profile.id === targetProfileId)?.name ?? "outro perfil");
          } catch {
            // Best-effort — one failed share shouldn't block the others or the main save.
          }
        }
        if (sharedNames.length > 0) {
          toast.success(`Treino também registrado para ${sharedNames.join(", ")}.`);
        }
      }

      if (newlyUnlocked.length > 0) {
        // The achievement modal already plays this sound — avoid stacking it twice.
        setCelebrating(newlyUnlocked);
      } else {
        playSound("/sounds/tada.mp3", 0.35);
        onClose();
      }
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
    setStep("exercises");
    setShareWithProfileIds([]);
    startedAtRef.current = Date.now();
    deleteActiveSession(profileId, workout.id).catch(() => {});
    toast.success("Treino reiniciado.");
  }

  const progressInProgress = hasProgress(exerciseLogs, durationMin, note);
  const totalSets = exerciseLogs.reduce((sum, log) => sum + log.sets.length, 0);
  const doneSets = exerciseLogs.reduce((sum, log) => sum + log.sets.filter((set) => set.done).length, 0);

  return (
    <Modal open={open} onClose={onClose} title={workout.name}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {draft ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1.5 text-xs text-slate-200">
            <span className="truncate">Continuando treino em andamento</span>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex shrink-0 items-center gap-1 font-medium text-[var(--accent)] hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar
            </button>
          </div>
        ) : progressInProgress ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar treino
            </button>
          </div>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          {step === "exercises" ? (
            <motion.div
              key="exercises"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
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
              resetToken={resting.resetToken}
              onComplete={() => setResting(null)}
              onSkip={() => setResting(null)}
            />
          ) : null}
        </AnimatePresence>

        <div className="max-h-[64vh] space-y-2 overflow-y-auto pr-1">
          {exerciseLogs.length === 0 ? (
            <p className="text-sm text-slate-500">
              Todos os exercícios deste treino estão ocultos no momento.
            </p>
          ) : null}
          {exerciseLogs.map((log, index) => {
            const expanded = expandedId === log.id;
            const complete = isComplete(log);
            const doneCount = log.sets.filter((set) => set.done).length;
            const source = workout.exercises.find((exercise) => exercise.id === log.id);
            const prevSource =
              index > 0 ? workout.exercises.find((exercise) => exercise.id === exerciseLogs[index - 1].id) : null;
            const connectedToPrev = Boolean(prevSource?.linkedToNext);
            const connectedToNext = Boolean(source?.linkedToNext);

            return (
              <div
                key={log.id}
                className={cn(
                  "overflow-hidden border",
                  connectedToPrev ? "-mt-2" : "",
                  connectedToPrev || connectedToNext
                    ? "border-[var(--accent)]/40 bg-[var(--accent-soft)]"
                    : "border-[var(--border)] bg-[var(--surface-2)]",
                  connectedToPrev && connectedToNext
                    ? "rounded-none"
                    : connectedToNext
                      ? "rounded-t-2xl rounded-b-none"
                      : connectedToPrev
                        ? "rounded-b-2xl rounded-t-none"
                        : "rounded-2xl",
                )}
              >
                {connectedToPrev || connectedToNext ? (
                  <p className="flex items-center gap-1 px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
                    <Link2 className="h-3 w-3" />
                    Superserie
                  </p>
                ) : null}
                <div className="flex w-full items-start gap-3 p-3">
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
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <span
                      className={cn(
                        "mt-0.5 shrink-0 text-slate-500 transition-transform",
                        expanded ? "rotate-90" : "",
                      )}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-white">{log.name}</p>
                      {log.muscleGroup ? <p className="text-xs text-slate-400">{log.muscleGroup}</p> : null}
                    </div>
                    {complete ? (
                      <span className="mt-0.5 shrink-0 rounded-full border border-[var(--accent)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">
                        Concluído
                      </span>
                    ) : (
                      <span className="mt-0.5 shrink-0 text-xs text-slate-400">
                        {doneCount}/{log.sets.length} séries
                      </span>
                    )}
                  </button>
                  {source ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setViewingInfoFor(log.id);
                      }}
                      className="mt-1 shrink-0 text-slate-500 hover:text-[var(--accent)]"
                      aria-label="Ver instruções do exercício"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  ) : null}
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
                            className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                          >
                            <Play className="h-3 w-3" />
                            Ver vídeo de como fazer
                          </button>
                        ) : null}

                        <div className="space-y-2">
                          {(() => {
                            const isTimeBased = source?.measureType === "time";
                            const showWeight = source?.trackWeight !== false;
                            const gridColsClass = showWeight
                              ? "grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem_1.5rem]"
                              : "grid-cols-[1.75rem_minmax(0,1fr)_2.25rem_1.5rem]";

                            return (
                              <>
                                <div
                                  className={cn(
                                    "grid items-center gap-2 px-1 text-[10px] uppercase tracking-[0.15em] text-slate-500",
                                    gridColsClass,
                                  )}
                                >
                                  <span />
                                  <span>{isTimeBased ? "Tempo" : "Reps"}</span>
                                  {showWeight ? <span>Carga (kg)</span> : null}
                                  <span className="text-center">OK</span>
                                  <span />
                                </div>
                                {log.sets.map((set, index) => (
                                  <div key={index} className={cn("grid items-center gap-2", gridColsClass)}>
                                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--surface)] text-xs font-medium text-slate-300">
                                      {index + 1}
                                    </span>
                                    {isTimeBased ? (
                                      <div className="flex min-w-0 items-center gap-1.5">
                                        <input
                                          type="number"
                                          min={0}
                                          value={set.durationSeconds ?? ""}
                                          onChange={(event) =>
                                            updateSet(log.id, index, {
                                              durationSeconds: event.target.value === "" ? 0 : Number(event.target.value),
                                            })
                                          }
                                          placeholder="Seg."
                                          className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--field-bg)] px-2 py-2 text-center text-sm text-white outline-none focus:border-[var(--accent)]"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setActiveTimer({ logId: log.id, setIndex: index })}
                                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--field-bg)] text-[var(--accent)] transition hover:border-[var(--accent)]"
                                          aria-label="Abrir cronômetro"
                                        >
                                          <Clock className="h-4 w-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <input
                                        value={set.reps}
                                        onChange={(event) => updateSet(log.id, index, { reps: event.target.value })}
                                        placeholder="Reps"
                                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--field-bg)] px-2 py-2 text-center text-sm text-white outline-none focus:border-[var(--accent)]"
                                      />
                                    )}
                                    {showWeight ? (
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
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={() => updateSet(log.id, index, { done: !set.done })}
                                      aria-pressed={set.done}
                                      aria-label={set.done ? "Marcar série como não concluída" : "Marcar série como concluída"}
                                      className="grid h-7 w-7 place-items-center justify-self-center rounded-full border-2 transition"
                                      style={
                                        set.done
                                          ? { borderColor: "var(--accent)", backgroundColor: "var(--accent)", color: "var(--bg)" }
                                          : { borderColor: "var(--border-strong)", color: "transparent" }
                                      }
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeSet(log.id, index)}
                                      className="justify-self-center text-slate-500 hover:text-red-300"
                                      aria-label="Remover série"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </>
                            );
                          })()}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <button
                            type="button"
                            onClick={() => addSet(log.id)}
                            className="text-xs font-medium text-[var(--accent)] hover:underline"
                          >
                            + Adicionar série
                          </button>
                          {!complete ? (
                            <button
                              type="button"
                              onClick={() => completeAllSets(log.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Concluir tudo
                            </button>
                          ) : null}
                        </div>

                        <Textarea
                          value={log.notes}
                          onChange={(event) => updateExerciseNote(log.id, event.target.value)}
                          rows={2}
                          placeholder="Nota deste exercício (opcional) — técnica, dor, ajuste do banco..."
                          className="text-xs"
                        />
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

              <Button type="button" className="w-full" onClick={goToSummary}>
                Continuar
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={() => setStep("exercises")}
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar aos exercícios
              </button>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
                <p className="text-2xl font-bold text-white">
                  {doneSets}/{totalSets}
                </p>
                <p className="text-xs text-slate-400">séries concluídas</p>
              </div>

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

              <Field label="Nota geral (opcional)">
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  placeholder="Como foi o treino?"
                />
              </Field>

              {shareableProfiles.length > 0 ? (
                <div>
                  <span className="mb-2 block text-sm text-slate-300">
                    Compartilhar este treino com (opcional)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {shareableProfiles.map((profile) => {
                      const selected = shareWithProfileIds.includes(profile.id);
                      return (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => toggleShareProfile(profile.id)}
                          aria-pressed={selected}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                            selected
                              ? "border-[var(--accent)] text-[var(--bg)]"
                              : "border-[var(--border)] text-slate-300 hover:border-[var(--accent)]",
                          )}
                          style={selected ? { background: "var(--accent)" } : undefined}
                        >
                          {selected ? <Check className="h-3.5 w-3.5" /> : null}
                          {profile.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Ao concluir, esse treino também entra no histórico e nas estatísticas dos perfis marcados.
                  </p>
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Salvando..." : "Concluir treino"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
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

      <ExerciseInfoModal
        exercise={workout.exercises.find((exercise) => exercise.id === viewingInfoFor) ?? null}
        instructions={
          exerciseDefs.find(
            (def) => def.id === workout.exercises.find((exercise) => exercise.id === viewingInfoFor)?.exerciseId,
          )?.notes ?? ""
        }
        open={viewingInfoFor !== null}
        onClose={() => setViewingInfoFor(null)}
      />

      {activeTimer
        ? (() => {
            const log = exerciseLogs.find((item) => item.id === activeTimer.logId);
            const set = log?.sets[activeTimer.setIndex];
            if (!log || !set) return null;
            return (
              <SetTimerModal
                open
                exerciseName={log.name}
                setLabel={`Série ${activeTimer.setIndex + 1} de ${log.sets.length}`}
                targetSeconds={set.durationSeconds ?? 0}
                onClose={() => setActiveTimer(null)}
                onComplete={() => updateSet(activeTimer.logId, activeTimer.setIndex, { done: true })}
              />
            );
          })()
        : null}

      <ConfirmDialog
        open={confirmReset}
        title="Reiniciar treino?"
        description="Isso apaga o progresso atual (séries marcadas, cargas e nota) e começa do zero."
        confirmLabel="Reiniciar"
        danger
        onClose={() => setConfirmReset(false)}
        onConfirm={resetWorkout}
      />

      <AchievementUnlockModal
        achievements={celebrating}
        open={celebrating.length > 0}
        onClose={() => {
          setCelebrating([]);
          onClose();
        }}
      />
    </Modal>
  );
}

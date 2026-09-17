"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import type { Exercise } from "@/types/workout";

export function ExerciseInfoModal({
  exercise,
  instructions,
  open,
  onClose,
}: {
  exercise: Exercise | null;
  /** Instructions from the exercise's library entry (registered notes), not the per-workout plan notes. */
  instructions: string;
  open: boolean;
  onClose: () => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && exercise ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative max-h-[80dvh] w-full overflow-y-auto rounded-t-[28px] border border-[var(--border-strong)] bg-[var(--surface)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-sm sm:rounded-[28px]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-semibold text-white">{exercise.name}</h2>
                {exercise.muscleGroup ? (
                  <p className="mt-0.5 text-xs text-slate-400">{exercise.muscleGroup}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-slate-300 transition hover:border-[var(--accent)] hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className={cn("grid gap-2 text-center", exercise.trackWeight ? "grid-cols-3" : "grid-cols-2")}>
              <div className="rounded-xl bg-[var(--field-bg)] px-2 py-2.5">
                <p className="text-sm font-bold text-white">{exercise.sets}</p>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-500">Séries</p>
              </div>
              <div className="rounded-xl bg-[var(--field-bg)] px-2 py-2.5">
                <p className="text-sm font-bold text-white">
                  {exercise.measureType === "time" ? `${exercise.durationSeconds ?? "—"}s` : exercise.reps || "—"}
                </p>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-500">
                  {exercise.measureType === "time" ? "Duração" : "Reps"}
                </p>
              </div>
              {exercise.trackWeight ? (
                <div className="rounded-xl bg-[var(--field-bg)] px-2 py-2.5">
                  <p className="text-sm font-bold text-white">{exercise.weight != null ? `${exercise.weight}kg` : "—"}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-500">Carga</p>
                </div>
              ) : null}
            </div>

            {instructions ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Instruções</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                  {instructions}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Nenhuma instrução cadastrada para este exercício.</p>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

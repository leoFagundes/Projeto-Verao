"use client";

import { motion } from "framer-motion";
import { Dumbbell, Info, Link2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { formatDate, formatDaysAgo } from "@/lib/utils";
import type { Workout } from "@/types/workout";

import { WorkoutDetailsModal } from "./workout-details-modal";

export function WorkoutCard({ workout, profileId, index }: { workout: Workout; profileId: string; index: number }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const activeCount = workout.exercises.filter((exercise) => !exercise.hidden).length;
  const hiddenCount = workout.exercises.length - activeCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <Link
        href={`/perfil/${profileId}/treinos/${workout.id}`}
        className="block rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--accent)]">
              <Dumbbell className="h-5 w-5" />
              {workout.pendingChangeNote ? (
                <span
                  className="absolute -right-1 -top-1 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-[var(--surface)]"
                  style={{ background: "var(--accent)" }}
                  aria-hidden="true"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <h3 className="break-words text-lg font-semibold text-white">{workout.name}</h3>
              <p className="mt-1 text-sm text-slate-400">
                {activeCount} ativo{activeCount === 1 ? "" : "s"}
                {hiddenCount > 0 ? ` · ${hiddenCount} oculto${hiddenCount === 1 ? "" : "s"}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              setDetailsOpen(true);
            }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-slate-400 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            aria-label="Ver detalhes do treino"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {workout.lastPerformedAt
              ? `Último treino: ${formatDate(workout.lastPerformedAt)} · ${formatDaysAgo(workout.lastPerformedAt)}`
              : "Ainda não realizado"}
          </p>
          {workout.linkedWorkouts.length > 0 ? (
            <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">
              <Link2 className="h-3 w-3" />
              {workout.linkedWorkouts.length === 1 ? "1 vínculo" : `${workout.linkedWorkouts.length} vínculos`}
            </span>
          ) : null}
          {workout.pendingChangeNote ? (
            <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">
              <Sparkles className="h-3 w-3" />
              Atualizado
            </span>
          ) : null}
        </div>
      </Link>

      {detailsOpen ? (
        <WorkoutDetailsModal workout={workout} profileId={profileId} onClose={() => setDetailsOpen(false)} />
      ) : null}
    </motion.div>
  );
}

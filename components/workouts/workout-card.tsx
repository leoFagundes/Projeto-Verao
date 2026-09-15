"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { formatDate } from "@/lib/utils";
import type { Workout } from "@/types/workout";

export function WorkoutCard({ workout, profileId, index }: { workout: Workout; profileId: string; index: number }) {
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
          <div className="min-w-0">
            <h3 className="break-words text-lg font-semibold text-white">{workout.name}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {workout.exercises.length} exercício{workout.exercises.length === 1 ? "" : "s"}
            </p>
          </div>
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg text-slate-950"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            🏋️
          </div>
        </div>

        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
          {workout.lastPerformedAt
            ? `Último treino: ${formatDate(workout.lastPerformedAt)}`
            : "Ainda não realizado"}
        </p>
      </Link>
    </motion.div>
  );
}

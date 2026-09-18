"use client";

import { motion } from "framer-motion";

import { formatDate, formatDuration, formatPace } from "@/lib/utils";
import { RUN_TYPES, type Run } from "@/types/run";

export function RunCard({
  run,
  index,
  onEdit,
  onDelete,
  onShare,
}: {
  run: Run;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const typeMeta = RUN_TYPES.find((option) => option.key === run.type) ?? RUN_TYPES[0];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
      className="flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-slate-950"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          <typeMeta.icon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{run.distanceKm.toFixed(2)} km</h3>
            <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-[var(--accent)]">
              {typeMeta.label}
            </span>
          </div>
          <p className="text-sm text-slate-300">
            {run.type === "tiro" && run.repCount && run.repDistanceM
              ? `${run.repCount}x ${run.repDistanceM}m`
              : formatPace(run.paceSecPerKm)}{" "}
            · {formatDuration(run.durationMin)}
          </p>
          {run.note ? <p className="mt-1 text-xs text-slate-500">{run.note}</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="shrink-0 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs text-slate-300">
          {formatDate(run.date)}
        </span>
        <button type="button" onClick={onShare} className="text-sm font-medium text-[var(--accent)] hover:underline">
          Compartilhar
        </button>
        <button type="button" onClick={onEdit} className="text-sm text-slate-300 hover:text-white">
          Editar
        </button>
        <button type="button" onClick={onDelete} className="text-sm text-red-300 hover:text-red-200">
          Remover
        </button>
      </div>
    </motion.article>
  );
}

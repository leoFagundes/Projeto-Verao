"use client";

import { motion } from "framer-motion";

import { formatDate } from "@/lib/utils";
import { MEASUREMENT_FIELDS } from "@/types/measurement";
import type { BodyMeasurement } from "@/types/measurement";

export function MeasurementCard({
  measurement,
  index,
  onEdit,
  onDelete,
}: {
  measurement: BodyMeasurement;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const extras = MEASUREMENT_FIELDS.filter((field) => field.key !== "weightKg").flatMap((field) => {
    const value = measurement[field.key];
    return value == null ? [] : [`${field.label}: ${value}${field.unit ? field.unit : ""}`];
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
      className="flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        {measurement.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={measurement.photoUrl}
            alt={`Foto de progresso — ${formatDate(measurement.date)}`}
            className="h-12 w-12 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg text-slate-950"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            ⚖️
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white">
            {measurement.weightKg != null ? `${measurement.weightKg} kg` : formatDate(measurement.date)}
          </h3>
          {extras.length > 0 ? (
            <p className="text-sm text-slate-300">{extras.join(" · ")}</p>
          ) : null}
          {measurement.note ? <p className="mt-1 text-xs text-slate-500">{measurement.note}</p> : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs text-slate-300">
          {formatDate(measurement.date)}
        </span>
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

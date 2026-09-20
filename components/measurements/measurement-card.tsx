"use client";

import { motion } from "framer-motion";
import { Scale } from "lucide-react";

import { formatDate } from "@/lib/utils";
import { MEASUREMENT_FIELDS } from "@/types/measurement";
import type { BodyMeasurement } from "@/types/measurement";

export function MeasurementCard({
  measurement,
  index,
  onView,
  onEdit,
  onDelete,
}: {
  measurement: BodyMeasurement;
  index: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const extras = MEASUREMENT_FIELDS.filter((field) => field.key !== "weightKg").flatMap((field) => {
    const value = measurement[field.key];
    return value == null ? [] : [`${field.label}: ${value}${field.unit ? field.unit : ""}`];
  });
  const cover = measurement.photos[0] ?? null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
      className="flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 transition sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        {cover ? (
          <div className="relative h-12 w-12 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt={`Foto de progresso — ${formatDate(measurement.date)}`}
              className="h-full w-full rounded-2xl object-cover"
            />
            {measurement.photos.length > 1 ? (
              <span className="absolute -bottom-1 -right-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white">
                +{measurement.photos.length - 1}
              </span>
            ) : null}
          </div>
        ) : (
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg text-slate-950"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            <Scale className="h-5 w-5" />
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

      <div className="flex flex-wrap shrink-0 items-center gap-x-3 gap-y-1.5">
        <span className="shrink-0 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs text-slate-300">
          {formatDate(measurement.date)}
        </span>
        <button type="button" onClick={onView} className="text-sm text-slate-300 hover:text-white">
          Visualizar
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

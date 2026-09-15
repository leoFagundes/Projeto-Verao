"use client";

import { motion } from "framer-motion";

import { cn, formatDate } from "@/lib/utils";
import { MEASUREMENT_FIELDS } from "@/types/measurement";
import type { BodyMeasurement } from "@/types/measurement";

export function MeasurementCard({
  measurement,
  index,
  onEdit,
  onDelete,
  selectable,
  selected,
  onToggleSelect,
}: {
  measurement: BodyMeasurement;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const extras = MEASUREMENT_FIELDS.filter((field) => field.key !== "weightKg").flatMap((field) => {
    const value = measurement[field.key];
    return value == null ? [] : [`${field.label}: ${value}${field.unit ? field.unit : ""}`];
  });
  const cover = measurement.photos[0] ?? null;

  const content = (
    <>
      <div className="flex items-center gap-3">
        {selectable ? (
          <span
            aria-hidden="true"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition"
            style={
              selected
                ? { borderColor: "var(--accent)", backgroundColor: "var(--accent)", color: "var(--bg)" }
                : { borderColor: "var(--border-strong)", color: "transparent" }
            }
          >
            ✓
          </span>
        ) : null}
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
        {!selectable ? (
          <>
            <button type="button" onClick={onEdit} className="text-sm text-slate-300 hover:text-white">
              Editar
            </button>
            <button type="button" onClick={onDelete} className="text-sm text-red-300 hover:text-red-200">
              Remover
            </button>
          </>
        ) : null}
      </div>
    </>
  );

  const className = cn(
    "flex flex-col gap-3 rounded-[24px] border p-4 sm:flex-row sm:items-center sm:justify-between transition",
    selected ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface)]",
  );

  if (selectable) {
    return (
      <motion.button
        type="button"
        onClick={onToggleSelect}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
        className={cn(className, "w-full text-left")}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
      className={className}
    >
      {content}
    </motion.article>
  );
}

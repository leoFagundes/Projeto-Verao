"use client";

import { useState } from "react";

import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Modal } from "@/components/ui/modal";
import { formatDateLong } from "@/lib/utils";
import { MEASUREMENT_FIELDS } from "@/types/measurement";
import type { BodyMeasurement } from "@/types/measurement";

const COMPARE_ROWS = [{ key: "heightCm", label: "Altura", unit: "cm" }, ...MEASUREMENT_FIELDS] as const;

export function MeasurementCompareModal({
  open,
  onClose,
  measurements,
}: {
  open: boolean;
  onClose: () => void;
  measurements: BodyMeasurement[];
}) {
  const [viewing, setViewing] = useState<{ photos: string[]; index: number } | null>(null);
  const ordered = [...measurements].sort((a, b) => a.date - b.date);

  return (
    <Modal open={open} onClose={onClose} title="Comparar medidas">
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6">
        {ordered.map((measurement) => (
          <div
            key={measurement.id}
            className="w-[210px] shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
          >
            <p className="text-sm font-semibold text-white">{formatDateLong(measurement.date)}</p>

            {measurement.photos.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {measurement.photos.map((photo, index) => (
                  <button
                    key={photo}
                    type="button"
                    onClick={() => setViewing({ photos: measurement.photos, index })}
                    className="aspect-square overflow-hidden rounded-xl border border-[var(--border)] transition hover:border-[var(--accent)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`Foto — ${formatDateLong(measurement.date)}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-3 grid h-20 place-items-center rounded-xl border border-dashed border-[var(--border)] text-[11px] text-slate-500">
                Sem fotos
              </div>
            )}

            <div className="mt-3 space-y-1.5">
              {COMPARE_ROWS.map((row) => {
                const value = measurement[row.key];
                return (
                  <div key={row.key} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400">{row.label}</span>
                    <span className="font-medium text-white">
                      {value != null ? `${value}${row.unit}` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            {measurement.note ? (
              <p className="mt-3 border-t border-[var(--border)] pt-2 text-xs text-slate-400">
                {measurement.note}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <ImageLightbox
        images={viewing?.photos ?? []}
        initialIndex={viewing?.index ?? 0}
        open={viewing !== null}
        onClose={() => setViewing(null)}
      />
    </Modal>
  );
}

"use client";

import { ArrowLeftRight, Check, Columns2 } from "lucide-react";
import { useState } from "react";

import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Modal } from "@/components/ui/modal";
import { PhotoCompareSlider } from "@/components/ui/photo-compare-slider";
import { PhotoSideBySide } from "@/components/ui/photo-side-by-side";
import { cn, formatDateLong } from "@/lib/utils";
import { MEASUREMENT_FIELDS } from "@/types/measurement";
import type { BodyMeasurement } from "@/types/measurement";

const COMPARE_ROWS = [{ key: "heightCm", label: "Altura", unit: "cm" }, ...MEASUREMENT_FIELDS] as const;

function formatSliderLabel(measurement: BodyMeasurement) {
  const date = formatDateLong(measurement.date);
  return measurement.weightKg != null ? `${date} · ${measurement.weightKg} kg` : date;
}

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
  const [sliderOpen, setSliderOpen] = useState(false);
  const [sideBySideOpen, setSideBySideOpen] = useState(false);
  const [photoChoice, setPhotoChoice] = useState<Record<string, number>>({});
  const ordered = [...measurements].sort((a, b) => a.date - b.date);
  const before = ordered[0];
  const after = ordered[ordered.length - 1];
  const isCompareEligible = ordered.length === 2;

  function choiceFor(measurement: BodyMeasurement) {
    return photoChoice[measurement.id] ?? 0;
  }

  const beforePhoto = before?.photos[choiceFor(before)] ?? null;
  const afterPhoto = after?.photos[choiceFor(after)] ?? null;
  const canSlide = isCompareEligible && beforePhoto != null && afterPhoto != null;

  return (
    <Modal open={open} onClose={onClose} title="Comparar medidas">
      {canSlide ? (
        <div className="mb-4 space-y-1.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSliderOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] py-2.5 text-sm font-medium text-[var(--accent)] hover:brightness-110"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Slider
            </button>
            <button
              type="button"
              onClick={() => setSideBySideOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] py-2.5 text-sm font-medium text-[var(--accent)] hover:brightness-110"
            >
              <Columns2 className="h-4 w-4" />
              Lado a lado
            </button>
          </div>
          {before.photos.length > 1 || after.photos.length > 1 ? (
            <p className="flex items-center justify-center gap-1 text-center text-[11px] text-slate-500">
              Toque em <Check className="h-3 w-3" /> numa foto para escolher qual entra no slider
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6">
        {ordered.map((measurement) => (
          <div
            key={measurement.id}
            className="w-[210px] shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
          >
            <p className="text-sm font-semibold text-white">{formatDateLong(measurement.date)}</p>

            {measurement.photos.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {measurement.photos.map((photo, index) => {
                  const isSlideEndpoint =
                    isCompareEligible &&
                    measurement.photos.length > 1 &&
                    (measurement.id === before.id || measurement.id === after.id);
                  const isChosen = isSlideEndpoint && choiceFor(measurement) === index;

                  return (
                    <div key={photo} className="relative">
                      <button
                        type="button"
                        onClick={() => setViewing({ photos: measurement.photos, index })}
                        className={cn(
                          "aspect-square w-full overflow-hidden rounded-xl border transition hover:border-[var(--accent)]",
                          isChosen ? "border-[var(--accent)]" : "border-[var(--border)]",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo}
                          alt={`Foto — ${formatDateLong(measurement.date)}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                      {isSlideEndpoint ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPhotoChoice((current) => ({ ...current, [measurement.id]: index }));
                          }}
                          aria-label="Usar esta foto no slider"
                          className={cn(
                            "absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full border transition",
                            isChosen
                              ? "border-[var(--accent)] bg-[var(--accent)] text-slate-950"
                              : "border-white/40 bg-black/50 text-transparent hover:text-white/70",
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
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

      {canSlide ? (
        <>
          <PhotoCompareSlider
            before={beforePhoto}
            after={afterPhoto}
            beforeLabel={formatSliderLabel(before)}
            afterLabel={formatSliderLabel(after)}
            open={sliderOpen}
            onClose={() => setSliderOpen(false)}
          />
          <PhotoSideBySide
            before={beforePhoto}
            after={afterPhoto}
            beforeLabel={formatSliderLabel(before)}
            afterLabel={formatSliderLabel(after)}
            open={sideBySideOpen}
            onClose={() => setSideBySideOpen(false)}
          />
        </>
      ) : null}
    </Modal>
  );
}

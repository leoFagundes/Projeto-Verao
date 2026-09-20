"use client";

import { ArrowDown, ArrowLeft, ArrowLeftRight, ArrowUp, Check, Columns2, Info, Scale } from "lucide-react";
import { useEffect, useState } from "react";

import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Modal } from "@/components/ui/modal";
import { PhotoCompareSlider } from "@/components/ui/photo-compare-slider";
import { PhotoSideBySide } from "@/components/ui/photo-side-by-side";
import { MEASUREMENT_DIRECTION, MEASUREMENT_REFERENCE } from "@/lib/measurement-reference";
import { cn, formatDateLong } from "@/lib/utils";
import { MEASUREMENT_FIELDS, type BodyMeasurement, type MeasurementFieldKey } from "@/types/measurement";

import { MeasurementInfoModal } from "./measurement-info-modal";

const COMPARE_ROWS = [{ key: "heightCm", label: "Altura", unit: "cm" }, ...MEASUREMENT_FIELDS] as const;

function referenceFor(key: string) {
  return key === "heightCm" ? undefined : MEASUREMENT_REFERENCE[key as MeasurementFieldKey];
}

function directionFor(key: string) {
  return key === "heightCm" ? undefined : MEASUREMENT_DIRECTION[key as MeasurementFieldKey];
}

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewing, setViewing] = useState<{ photos: string[]; index: number } | null>(null);
  const [sliderOpen, setSliderOpen] = useState(false);
  const [sideBySideOpen, setSideBySideOpen] = useState(false);
  const [photoChoice, setPhotoChoice] = useState<Record<string, number>>({});
  const [infoField, setInfoField] = useState<MeasurementFieldKey | null>(null);

  // Fresh selection every time the modal is opened, rather than remembering
  // the last pair — the modal stays mounted between opens (like the rest of
  // this app's modals), so this only resets state at the actual open moment.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (open) {
      setSelectedIds([]);
      setPhotoChoice({});
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  function toggleSelect(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      // Already have a pair — swap in the new pick for the older one instead
      // of just ignoring the tap, so nothing feels unresponsive.
      if (current.length >= 2) return [current[1], id];
      return [...current, id];
    });
  }

  const selected = measurements.filter((m) => selectedIds.includes(m.id));
  const ordered = [...selected].sort((a, b) => a.date - b.date);
  const before = ordered[0];
  const after = ordered[1];
  const readyToCompare = ordered.length === 2;

  function choiceFor(measurement: BodyMeasurement) {
    return photoChoice[measurement.id] ?? 0;
  }

  const beforePhoto = before?.photos[choiceFor(before)] ?? null;
  const afterPhoto = after?.photos[choiceFor(after)] ?? null;
  const canSlide = readyToCompare && beforePhoto != null && afterPhoto != null;

  const historyOrdered = [...measurements].sort((a, b) => b.date - a.date);

  return (
    <Modal open={open} onClose={onClose} title="Comparar medidas">
      {!readyToCompare ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Escolha duas medidas para comparar{selectedIds.length > 0 ? ` (${selectedIds.length}/2)` : ""}.
          </p>
          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {historyOrdered.map((measurement) => {
              const isSelected = selectedIds.includes(measurement.id);
              const cover = measurement.photos[0] ?? null;
              return (
                <button
                  key={measurement.id}
                  type="button"
                  onClick={() => toggleSelect(measurement.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent)]",
                  )}
                >
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--surface)] text-slate-500">
                      <Scale className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{formatDateLong(measurement.date)}</p>
                    <p className="text-xs text-slate-400">
                      {measurement.weightKg != null ? `${measurement.weightKg} kg` : "Sem peso registrado"}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition"
                    style={
                      isSelected
                        ? { borderColor: "var(--accent)", backgroundColor: "var(--accent)", color: "var(--bg)" }
                        : { borderColor: "var(--border-strong)", color: "transparent" }
                    }
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Trocar seleção
          </button>

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
                      const isSlideEndpoint = measurement.photos.length > 1;
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

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-slate-500">O que mudou</p>
            <div className="space-y-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
              {COMPARE_ROWS.map((row) => {
                const beforeValue = before[row.key];
                const afterValue = after[row.key];
                if (beforeValue == null || afterValue == null) return null;

                const diff = Math.round((afterValue - beforeValue) * 100) / 100;
                const direction = directionFor(row.key);
                const improved = diff === 0 || !direction ? null : direction === "higherIsBetter" ? diff > 0 : diff < 0;
                const ArrowIcon = diff > 0 ? ArrowUp : diff < 0 ? ArrowDown : null;

                return (
                  <div key={row.key} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1 text-slate-400">
                      {row.label}
                      {referenceFor(row.key) ? (
                        <button
                          type="button"
                          onClick={() => setInfoField(row.key as MeasurementFieldKey)}
                          className="text-slate-500 transition hover:text-[var(--accent)]"
                          aria-label={`O que é ${row.label}?`}
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1 font-medium",
                        improved === true ? "text-emerald-400" : improved === false ? "text-red-400" : "text-slate-300",
                      )}
                    >
                      {ArrowIcon ? <ArrowIcon className="h-3.5 w-3.5" /> : null}
                      {diff > 0 ? "+" : ""}
                      {diff}
                      {row.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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

      <MeasurementInfoModal field={infoField} open={infoField !== null} onClose={() => setInfoField(null)} />
    </Modal>
  );
}

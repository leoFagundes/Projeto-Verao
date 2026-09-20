"use client";

import { toPng } from "html-to-image";
import { Info, Scale, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Modal } from "@/components/ui/modal";
import { MEASUREMENT_REFERENCE } from "@/lib/measurement-reference";
import { formatDateLong } from "@/lib/utils";
import { MEASUREMENT_FIELDS, type BodyMeasurement, type MeasurementFieldKey } from "@/types/measurement";
import type { Profile } from "@/types/profile";

import { MeasurementInfoModal } from "./measurement-info-modal";
import { MeasurementShareCard } from "./measurement-share-card";

export function MeasurementDetailModal({
  measurement,
  profile,
  open,
  onClose,
}: {
  measurement: BodyMeasurement | null;
  profile?: Profile | null;
  open: boolean;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [viewingPhotos, setViewingPhotos] = useState(false);
  const [infoField, setInfoField] = useState<MeasurementFieldKey | null>(null);

  async function handleShare() {
    if (!cardRef.current || !measurement) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const fileName = `medidas-${measurement.date}.png`;

      const canUseWebShare = typeof navigator !== "undefined" && "share" in navigator && "canShare" in navigator;
      if (canUseWebShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], fileName, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Minhas medidas" });
          return;
        }
      }

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      link.click();
      toast.success("Imagem baixada!");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("Não foi possível gerar a imagem.");
    } finally {
      setSharing(false);
    }
  }

  if (!measurement) return null;

  const heightRow = measurement.heightCm != null ? { label: "Altura", unit: "cm", value: measurement.heightCm } : null;
  const fieldRows = MEASUREMENT_FIELDS.flatMap((field) => {
    const value = measurement[field.key];
    return value == null ? [] : [{ key: field.key, label: field.label, unit: field.unit, value }];
  });

  return (
    <Modal open={open} onClose={onClose} title={formatDateLong(measurement.date)}>
      <div className="space-y-4">
        {measurement.photos.length > 0 ? (
          <button type="button" onClick={() => setViewingPhotos(true)} className="block w-full">
            <div className="grid grid-cols-3 gap-1.5">
              {measurement.photos.slice(0, 6).map((photo, index) => (
                <div key={photo} className="relative aspect-square overflow-hidden rounded-xl border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                  {index === 5 && measurement.photos.length > 6 ? (
                    <span className="absolute inset-0 grid place-items-center bg-black/60 text-sm font-semibold text-white">
                      +{measurement.photos.length - 5}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </button>
        ) : (
          <div className="grid h-20 place-items-center rounded-2xl border border-dashed border-[var(--border)] text-slate-500">
            <Scale className="h-6 w-6" />
          </div>
        )}

        <div className="space-y-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          {heightRow ? (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-400">{heightRow.label}</span>
              <span className="font-medium text-white">
                {heightRow.value}
                {heightRow.unit}
              </span>
            </div>
          ) : null}
          {fieldRows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-1 text-slate-400">
                {row.label}
                {MEASUREMENT_REFERENCE[row.key] ? (
                  <button
                    type="button"
                    onClick={() => setInfoField(row.key)}
                    className="text-slate-500 transition hover:text-[var(--accent)]"
                    aria-label={`O que é ${row.label}?`}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </span>
              <span className="font-medium text-white">
                {row.value}
                {row.unit}
              </span>
            </div>
          ))}
        </div>

        {measurement.note ? (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-slate-300">
            {measurement.note}
          </p>
        ) : null}

        <Button onClick={handleShare} disabled={sharing} className="w-full">
          {sharing ? (
            "Gerando imagem..."
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhar
            </span>
          )}
        </Button>
      </div>

      {/* Off-screen, capture-only render — the visible view above is the
       * interactive one (with info buttons etc.), this is just what gets
       * turned into the shareable image. */}
      <div className="pointer-events-none fixed left-[-9999px] top-0" aria-hidden="true">
        <div ref={cardRef}>
          <MeasurementShareCard measurement={measurement} profile={profile} />
        </div>
      </div>

      <ImageLightbox images={measurement.photos} open={viewingPhotos} onClose={() => setViewingPhotos(false)} />
      <MeasurementInfoModal field={infoField} open={infoField !== null} onClose={() => setInfoField(null)} />
    </Modal>
  );
}

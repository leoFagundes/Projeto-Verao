"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { getCroppedImageBlob } from "@/lib/image-processing";

/** Full-screen crop step shown right after picking a photo — lets you drag
 * and zoom to choose exactly which part of the image ends up on the card,
 * before it's ever uploaded. */
export function ImageCropModal({
  open,
  imageSrc,
  shape = "circle",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  imageSrc: string | null;
  shape?: "circle" | "square";
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Fresh crop/zoom for each new photo — needs the latest `imageSrc`, so
    // this can't be computed during render.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, imageSrc]);

  const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!imageSrc || !croppedAreaPixels || processing) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch {
      toast.error("Não foi possível recortar essa imagem.");
    } finally {
      setProcessing(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && imageSrc ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex flex-col bg-[var(--bg)]"
        >
          <div className="flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={onCancel}
              className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-slate-300 transition hover:border-[var(--accent)] hover:text-white"
              aria-label="Cancelar"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="text-sm font-medium text-white">Ajustar foto</p>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={processing}
              className="grid h-10 w-10 place-items-center rounded-full text-[var(--bg)] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
              aria-label="Usar foto"
            >
              <Check className="h-5 w-5" />
            </button>
          </div>

          <div className="relative m-5 flex-1 overflow-hidden rounded-[28px] bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape={shape === "circle" ? "round" : "rect"}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>

          <div className="flex items-center gap-3 px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <ZoomIn className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-[var(--accent)]"
              aria-label="Zoom"
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

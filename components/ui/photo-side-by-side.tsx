"use client";

import { AnimatePresence, motion } from "framer-motion";
import { toPng } from "html-to-image";
import { Download, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { proxiedImageSrc } from "@/lib/proxied-image";

/** Same "before/after" pair as PhotoCompareSlider, but shown side by side
 * instead of overlaid — some comparisons read easier without having to drag.
 * Stacks vertically on narrow screens instead of squeezing two photos side
 * by side, and the date/weight label sits below each photo (not overlaid on
 * top of it) so it never covers the image. */
export function PhotoSideBySide({
  before,
  after,
  beforeLabel,
  afterLabel,
  open,
  onClose,
}: {
  before: string | null;
  after: string | null;
  beforeLabel?: string;
  afterLabel?: string;
  open: boolean;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  async function handleDownload() {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#000000" });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `comparacao-${Date.now()}.png`;
      link.click();
      toast.success("Imagem baixada!");
    } catch {
      toast.error("Não foi possível gerar a imagem para baixar.");
    } finally {
      setDownloading(false);
    }
  }

  if (typeof document === "undefined" || !before || !after) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] overflow-y-auto bg-black/75 p-4 backdrop-blur-2xl sm:p-8"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="fixed right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="mx-auto my-8 w-full max-w-2xl"
          >
            <div ref={cardRef} className="flex w-full flex-col gap-4 rounded-[28px] bg-black p-3 sm:flex-row">
              <div className="w-full sm:w-1/2">
                <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proxiedImageSrc(before)}
                    alt={beforeLabel ?? "Antes"}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </div>
                {beforeLabel ? (
                  <p className="mt-2 text-center text-xs font-medium text-white/80">{beforeLabel}</p>
                ) : null}
              </div>
              <div className="w-full sm:w-1/2">
                <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proxiedImageSrc(after)}
                    alt={afterLabel ?? "Depois"}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </div>
                {afterLabel ? (
                  <p className="mt-2 text-center text-xs font-medium text-white/80">{afterLabel}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDownload();
                }}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-black/40 transition disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
              >
                <Download className="h-4 w-4" />
                {downloading ? "Gerando..." : "Baixar imagem"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

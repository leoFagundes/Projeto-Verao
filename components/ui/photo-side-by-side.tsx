"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

/** Same "before/after" pair as PhotoCompareSlider, but shown side by side
 * instead of overlaid — some comparisons read easier without having to drag. */
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

  if (typeof document === "undefined" || !before || !after) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-2xl sm:p-8"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="flex w-full max-w-2xl gap-2 sm:gap-3"
          >
            <div className="relative aspect-[3/4] w-1/2 overflow-hidden rounded-2xl shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={before} alt={beforeLabel ?? "Antes"} className="h-full w-full object-cover" draggable={false} />
              {beforeLabel ? (
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
                  {beforeLabel}
                </span>
              ) : null}
            </div>
            <div className="relative aspect-[3/4] w-1/2 overflow-hidden rounded-2xl shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={after} alt={afterLabel ?? "Depois"} className="h-full w-full object-cover" draggable={false} />
              {afterLabel ? (
                <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
                  {afterLabel}
                </span>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

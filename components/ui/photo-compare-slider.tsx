"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function PhotoCompareSlider({
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
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    // Reset to the midpoint each time the slider opens — a fresh comparison
    // shouldn't start wherever the last drag left off.
    /* eslint-disable react-hooks/set-state-in-effect */
    setPosition(50);
    /* eslint-enable react-hooks/set-state-in-effect */

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

  function updateFromClientX(clientX: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  }

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
            ref={containerRef}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => {
              draggingRef.current = true;
              (event.target as Element).setPointerCapture(event.pointerId);
              updateFromClientX(event.clientX);
            }}
            onPointerMove={(event) => {
              if (draggingRef.current) updateFromClientX(event.clientX);
            }}
            onPointerUp={() => {
              draggingRef.current = false;
            }}
            className="relative aspect-[3/4] w-full max-w-md touch-none select-none overflow-hidden rounded-2xl shadow-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={after} alt={afterLabel ?? "Depois"} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={before} alt={beforeLabel ?? "Antes"} className="h-full w-full object-cover" draggable={false} />
            </div>

            {beforeLabel ? (
              <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
                {beforeLabel}
              </span>
            ) : null}
            {afterLabel ? (
              <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
                {afterLabel}
              </span>
            ) : null}

            <div
              className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]"
              style={{ left: `${position}%` }}
            />
            <div
              className="absolute top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-900 shadow-lg"
              style={{ left: `${position}%` }}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

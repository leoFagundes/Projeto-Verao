"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export function ImageLightbox({
  images,
  open,
  initialIndex = 0,
  onClose,
}: {
  images: string[];
  open: boolean;
  initialIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Jump to the tapped image and reset the counter whenever the lightbox
    // opens — needs the scroll container's real DOM size, not available
    // during render.
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setIndex(initialIndex);
    /* eslint-enable react-hooks/set-state-in-effect */
    const el = scrollRef.current;
    if (el) el.scrollLeft = initialIndex * el.clientWidth;
  }, [open, initialIndex]);

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

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(target: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
  }

  if (typeof document === "undefined" || images.length === 0) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-2xl"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur"
            aria-label="Fechar"
          >
            ✕
          </button>

          {images.length > 1 ? (
            <p className="absolute left-1/2 top-4 z-10 -translate-x-1/2 text-xs font-medium text-white/70">
              {index + 1} / {images.length}
            </p>
          ) : null}

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto"
          >
            {images.map((src, i) => (
              <div key={i} className="flex h-full w-full shrink-0 snap-center items-center justify-center p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Imagem ${i + 1}`} className="max-h-full max-w-full object-contain" />
              </div>
            ))}
          </div>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => goTo(Math.max(0, index - 1))}
                disabled={index === 0}
                className="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur disabled:opacity-30 sm:left-4"
                aria-label="Imagem anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => goTo(Math.min(images.length - 1, index + 1))}
                disabled={index === images.length - 1}
                className="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur disabled:opacity-30 sm:right-4"
                aria-label="Próxima imagem"
              >
                ›
              </button>
              <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Ir para imagem ${i + 1}`}
                    className={cn("h-1.5 w-1.5 rounded-full transition", i === index ? "bg-white" : "bg-white/30")}
                  />
                ))}
              </div>
            </>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

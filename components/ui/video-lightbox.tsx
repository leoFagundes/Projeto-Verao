"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { getYoutubeVideoId } from "@/lib/utils";

export function VideoLightbox({
  url,
  open,
  onClose,
}: {
  url: string | null;
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

  if (typeof document === "undefined" || !url) return null;

  const videoId = getYoutubeVideoId(url);

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

          {videoId ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="aspect-video w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                title="Vídeo do exercício"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
              />
            </motion.div>
          ) : (
            <div
              className="max-w-sm rounded-2xl border border-white/15 bg-white/5 p-6 text-center text-sm text-white"
              onClick={(event) => event.stopPropagation()}
            >
              <p>Não foi possível identificar esse link como um vídeo do YouTube.</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
              >
                Abrir o link original
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

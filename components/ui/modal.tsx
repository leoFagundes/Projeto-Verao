"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
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

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative max-h-[92dvh] w-full overflow-y-auto overflow-x-hidden rounded-t-[28px] border border-[var(--border-strong)] bg-[var(--surface)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-[28px] sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-slate-300 transition hover:border-[var(--accent)] hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

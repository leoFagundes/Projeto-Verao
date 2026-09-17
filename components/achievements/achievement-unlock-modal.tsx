"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import type { Achievement } from "@/lib/achievements";
import { playSound } from "@/lib/sound";

export function AchievementUnlockModal({
  achievements,
  open,
  onClose,
}: {
  achievements: Achievement[];
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    playSound("/sounds/tada.mp3", 0.35);

    const styles = getComputedStyle(document.documentElement);
    const accent = styles.getPropertyValue("--accent").trim() || "#818cf8";
    const accent2 = styles.getPropertyValue("--accent-2").trim() || "#38bdf8";
    const colors = [accent, accent2, "#ffffff"];

    confetti({ particleCount: 90, spread: 75, startVelocity: 45, origin: { y: 0.35 }, colors, zIndex: 9999 });
    const timeout = setTimeout(() => {
      confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0.1, y: 0.5 }, colors, zIndex: 9999 });
      confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 0.9, y: 0.5 }, colors, zIndex: 9999 });
    }, 200);

    return () => clearTimeout(timeout);
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-2xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-[28px] border border-[var(--accent)] bg-[var(--surface)] p-6 text-center shadow-2xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              {achievements.length === 1 ? "Nova conquista!" : "Novas conquistas!"}
            </p>

            <div className="mt-4 max-h-[45vh] space-y-3 overflow-y-auto pr-1">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.1 }}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left"
                >
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
                    style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                  >
                    <achievement.icon className="h-6 w-6" style={{ color: "var(--bg)" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{achievement.title}</p>
                    <p className="text-xs text-slate-400">{achievement.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-full py-2.5 text-sm font-semibold text-slate-950"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
            >
              Continuar
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

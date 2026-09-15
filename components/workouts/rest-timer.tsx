"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RestTimer({
  seconds,
  onComplete,
  onSkip,
}: {
  seconds: number;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [ringOffset, setRingOffset] = useState(0);
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    // Kick the CSS transition off on the next frame so the browser registers
    // the starting state (full ring) before animating to empty — a pure CSS
    // transition driven by the compositor, so it stays smooth regardless of
    // React re-renders elsewhere in the modal.
    const raf = requestAnimationFrame(() => setRingOffset(CIRCUMFERENCE));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (remaining <= 0) return;
    const timeout = setTimeout(() => setRemaining((current) => current - 1), 1000);
    return () => clearTimeout(timeout);
  }, [remaining]);

  useEffect(() => {
    if (remaining > 0 || done) return;
    // Reacting to the countdown reaching zero (real time elapsing) — not
    // something derivable during render.
    /* eslint-disable react-hooks/set-state-in-effect */
    setDone(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(200);
    const timeout = setTimeout(() => onCompleteRef.current(), 1400);
    return () => clearTimeout(timeout);
  }, [remaining, done]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-4 rounded-2xl border border-[var(--accent)] bg-[var(--surface-2)] p-3"
    >
      <div className="relative h-14 w-14 shrink-0">
        <svg viewBox="0 0 64 64" className="h-14 w-14 -rotate-90">
          <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r={RADIUS}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={ringOffset}
            style={{ transition: done ? "none" : `stroke-dashoffset ${seconds}s linear` }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-white">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.span
                key="done"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-lg"
              >
                ✓
              </motion.span>
            ) : (
              <motion.span key="count">{remaining}</motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{done ? "Descanso concluído" : "Descansando..."}</p>
        <p className="text-xs text-slate-400">{done ? "Bora pra próxima série" : "Próxima série já já"}</p>
      </div>

      {!done ? (
        <button
          type="button"
          onClick={onSkip}
          className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:text-white"
        >
          Pular
        </button>
      ) : null}
    </motion.div>
  );
}

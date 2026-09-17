"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RestTimer({
  seconds,
  resetToken,
  onComplete,
  onSkip,
}: {
  seconds: number;
  /** Bumped by the parent every time a fresh rest should start, even if
   * `seconds` happens to be the same number as last time (e.g. marking
   * another set of the same exercise) — otherwise the reset effect below
   * has nothing to react to and the countdown doesn't restart. */
  resetToken: number;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [ringOffset, setRingOffset] = useState(0);
  // 0 means "no transition" — the offset jump to the full ring must be
  // instant, only the countdown-to-empty animation should ease over time.
  const [ringDuration, setRingDuration] = useState(0);
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    // Restarts the same instance whenever the parent asks for a fresh count
    // (e.g. marking another set done while one is still resting) — this runs
    // on mount too, so it also covers the initial countdown. Resetting state
    // here instead of remounting (changing the `key`) avoids replaying the
    // enter/exit animation on every consecutive "OK". Snapping the offset
    // back to 0 with the transition off first, then turning the transition
    // back on and animating to full, is what makes the ring actually
    // restart instead of just crawling back from wherever it was.
    /* eslint-disable react-hooks/set-state-in-effect */
    setRemaining(seconds);
    setDone(false);
    setRingDuration(0);
    setRingOffset(0);
    /* eslint-enable react-hooks/set-state-in-effect */

    // On first mount, the "off" state above is already what the browser
    // paints first, so a single rAF is enough to kick off the transition.
    // On a reset of an already-mounted timer though, both the "off" and
    // "on" state updates get scheduled in the same tick with nothing forcing
    // a real paint in between — a single rAF can still land before that
    // paint happens, so the browser collapses both updates into one and the
    // ring never visibly snaps back. A second nested rAF guarantees at least
    // one full paint occurs with the transition disabled before it's turned
    // back on.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        setRingDuration(seconds);
        setRingOffset(CIRCUMFERENCE);
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [seconds, resetToken]);

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
            style={{ transition: done || ringDuration <= 0 ? "none" : `stroke-dashoffset ${ringDuration}s linear` }}
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
                <Check className="h-5 w-5" />
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

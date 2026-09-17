"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Pause, Play, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { playSound } from "@/lib/sound";
import { cn, formatClock } from "@/lib/utils";

const RADIUS = 130;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Full-screen countdown timer for a timed set — opens over everything with a
 * blurred backdrop, counts down from the set's target duration, and keeps
 * counting into "overtime" (past the target) if the set is held longer,
 * since exceeding a hold time is a normal, good outcome.
 *
 * This is purely a timing aid — it never writes anything back. The target
 * duration for each set is a manually-edited field (same idea as load), and
 * only changes when the user types a new value there; the clock reaching a
 * number never overwrites it. Every open is also a fresh attempt: it always
 * starts counting from zero, never resuming a previous run.
 */
export function SetTimerModal({
  open,
  exerciseName,
  setLabel,
  targetSeconds,
  onClose,
}: {
  open: boolean;
  exerciseName: string;
  setLabel: string;
  targetSeconds: number;
  onClose: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  // The ring is driven by a plain CSS transition instead of being re-animated
  // on every tick: on play/resume we set its *final* offset once and give it
  // a transition-duration matching the remaining time, so the browser
  // interpolates it continuously and smoothly, instead of stepping every
  // ~200ms the way re-triggering a short framer animation each tick would.
  const [ringOffset, setRingOffset] = useState(0);
  const [ringDuration, setRingDuration] = useState(0);
  const baseRef = useRef(0);
  const startRef = useRef(0);
  const vibratedRef = useRef(false);

  useEffect(() => {
    // Every open is a fresh attempt — always starts from zero, regardless of
    // what was committed for this set before.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open) return;
    setElapsed(0);
    baseRef.current = 0;
    setRunning(false);
    vibratedRef.current = false;
    setRingDuration(0);
    setRingOffset(0);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(baseRef.current + Math.floor((Date.now() - startRef.current) / 1000));
    }, 250);
    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (targetSeconds > 0 && elapsed >= targetSeconds && !vibratedRef.current) {
      vibratedRef.current = true;
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(200);
      playSound("/sounds/good.mp3", 0.3);
      // The CSS transition finishes exactly here too (its duration was set to
      // land on this moment) — pin the numeric state to match so a later
      // pause/resume computes from the same fully-drained starting point.
      setRingDuration(0);
      setRingOffset(CIRCUMFERENCE);
    }
  }, [elapsed, running, targetSeconds]);

  function toggle() {
    const hasTarget = targetSeconds > 0;
    if (running) {
      // Pause: freeze the ring exactly where the math says it is right now,
      // since we can't read the mid-transition value straight off the DOM.
      baseRef.current = elapsed;
      setRunning(false);
      if (hasTarget && elapsed < targetSeconds) {
        setRingDuration(0);
        setRingOffset((elapsed / targetSeconds) * CIRCUMFERENCE);
      }
      return;
    }

    setRunning(true);
    if (hasTarget && elapsed < targetSeconds) {
      const remainingNow = targetSeconds - elapsed;
      setRingDuration(remainingNow);
      // Kick off on the next frame so the browser paints the frozen offset
      // first, then animates to the new target — otherwise the transition
      // can get coalesced into the very first paint and never visibly play.
      requestAnimationFrame(() => setRingOffset(CIRCUMFERENCE));
    }
  }

  function reset() {
    setRunning(false);
    baseRef.current = 0;
    setElapsed(0);
    vibratedRef.current = false;
    setRingDuration(0);
    setRingOffset(0);
  }

  const hasTarget = targetSeconds > 0;
  const overtime = hasTarget && elapsed >= targetSeconds;
  const remaining = hasTarget ? Math.max(0, targetSeconds - elapsed) : elapsed;

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex flex-col bg-[var(--bg)]/90 backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{exerciseName}</p>
              <p className="text-xs text-slate-400">{setLabel}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-slate-300 transition hover:border-[var(--accent)] hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
            <div className="relative grid place-items-center">
              <svg viewBox="0 0 280 280" className="h-64 w-64 -rotate-90 sm:h-72 sm:w-72">
                <circle cx="140" cy="140" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle
                  cx="140"
                  cy="140"
                  r={RADIUS}
                  fill="none"
                  stroke={overtime ? "var(--accent-2)" : "var(--accent)"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={hasTarget ? ringOffset : 0}
                  className={overtime ? "animate-pulse" : undefined}
                  style={{
                    transition: ringDuration > 0 ? `stroke-dashoffset ${ringDuration}s linear` : "none",
                  }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  {overtime ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-2)]">
                      Tempo extra
                    </p>
                  ) : hasTarget ? (
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Restando</p>
                  ) : null}
                  <p
                    className={cn(
                      "font-bold tabular-nums text-white",
                      "text-6xl sm:text-7xl",
                    )}
                  >
                    {overtime ? `+${formatClock(elapsed - targetSeconds)}` : formatClock(remaining)}
                  </p>
                  {hasTarget ? (
                    <p className="mt-1 text-sm text-slate-400">Meta: {formatClock(targetSeconds)}</p>
                  ) : (
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Cronômetro</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={reset}
              className="grid h-14 w-14 place-items-center rounded-full border border-[var(--border-strong)] text-slate-300 transition hover:text-white"
              aria-label="Zerar"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={toggle}
              className="grid h-20 w-20 place-items-center rounded-full text-[var(--bg)] shadow-[0_10px_40px_rgba(var(--accent-rgb),0.45)] transition active:scale-95"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
              aria-label={running ? "Pausar" : "Iniciar"}
            >
              {running ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 translate-x-0.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-14 w-14 place-items-center rounded-full border border-[var(--accent)] text-[var(--accent)] transition hover:bg-[var(--accent-soft)]"
              aria-label="Fechar"
            >
              <Check className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

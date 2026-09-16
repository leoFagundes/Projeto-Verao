"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { formatClock } from "@/lib/utils";

/** A small start/pause/reset stopwatch for one timed set — commits the elapsed
 * seconds via `onChange` whenever it's paused or reset, so the parent always
 * has the latest value without re-rendering every tick. */
export function SetTimer({
  seconds,
  onChange,
  disabled,
}: {
  seconds: number;
  onChange: (seconds: number) => void;
  disabled?: boolean;
}) {
  const [elapsed, setElapsed] = useState(seconds);
  const [running, setRunning] = useState(false);
  const baseRef = useRef(seconds);
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(baseRef.current + Math.floor((Date.now() - startRef.current) / 1000));
    }, 200);
    return () => clearInterval(interval);
  }, [running]);

  function toggle() {
    if (disabled) return;
    if (running) {
      baseRef.current = elapsed;
      onChange(elapsed);
    }
    setRunning((current) => !current);
  }

  function reset() {
    if (disabled) return;
    setRunning(false);
    baseRef.current = 0;
    setElapsed(0);
    onChange(0);
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="min-w-[2.75rem] text-center text-sm font-semibold tabular-nums text-white">
        {formatClock(elapsed)}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-label={running ? "Pausar cronômetro" : "Iniciar cronômetro"}
        className="grid h-7 w-7 place-items-center rounded-full text-[var(--bg)] disabled:opacity-40"
        style={{ background: "var(--accent)" }}
      >
        {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 translate-x-px" />}
      </button>
      <button
        type="button"
        onClick={reset}
        disabled={disabled}
        aria-label="Zerar cronômetro"
        className="grid h-7 w-7 place-items-center rounded-full border border-[var(--border-strong)] text-slate-300 disabled:opacity-40"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

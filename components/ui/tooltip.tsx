"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

const LONG_PRESS_MS = 450;
const AUTO_HIDE_MS = 2000;

const ALIGN_CLASS = {
  center: "left-1/2 -translate-x-1/2",
  left: "left-0",
  right: "right-0",
} as const;

/** Icon-only buttons/links are hard to identify on mobile, where there's no
 * hover to reveal a native `title`. This shows the label on desktop hover
 * (or keyboard focus) as usual, and on mobile via a long press — a normal
 * tap still navigates/activates right away, only a held tap reveals the
 * label instead, swallowing that tap so it doesn't also navigate. */
export function Tooltip({
  label,
  align = "center",
  children,
}: {
  label: string;
  align?: keyof typeof ALIGN_CLASS;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const longPressRef = useRef(false);
  const pressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  function show() {
    setOpen(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setOpen(false), AUTO_HIDE_MS);
  }

  function handlePointerDown(event: ReactPointerEvent) {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
    longPressRef.current = false;
    pressTimeoutRef.current = setTimeout(() => {
      longPressRef.current = true;
      show();
    }, LONG_PRESS_MS);
  }

  function clearPress() {
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
      pressTimeoutRef.current = null;
    }
  }

  function handleClickCapture(event: ReactMouseEvent) {
    // A long press already showed the label — swallow the tap that ends it
    // instead of also navigating/activating, so the label has time to land.
    if (longPressRef.current) {
      event.preventDefault();
      event.stopPropagation();
      longPressRef.current = false;
    }
  }

  return (
    <span
      className="relative inline-flex"
      onPointerDown={handlePointerDown}
      onPointerUp={clearPress}
      onPointerLeave={clearPress}
      onPointerCancel={clearPress}
      onClickCapture={handleClickCapture}
      onMouseEnter={show}
      onMouseLeave={() => setOpen(false)}
      onFocus={show}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open ? (
          <motion.span
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            role="tooltip"
            className={cn(
              "pointer-events-none absolute top-full z-50 mt-2 whitespace-nowrap rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-white shadow-lg",
              ALIGN_CLASS[align],
            )}
          >
            {label}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}

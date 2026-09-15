import type { ReactNode } from "react";

import { Logo } from "./logo";

export function AppHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Logo className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-xs uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
            <h1 className="truncate text-lg font-semibold text-white">{title}</h1>
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}

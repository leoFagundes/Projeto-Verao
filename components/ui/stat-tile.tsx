import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 sm:p-4">
      <div className="flex items-center justify-between gap-1">
        <p className="min-w-0 truncate text-[9px] uppercase leading-tight tracking-[0.1em] text-slate-400 sm:text-xs sm:tracking-[0.2em]">
          {label}
        </p>
        {icon ? <span className="shrink-0 opacity-90">{icon}</span> : null}
      </div>
      <p className="mt-2 truncate text-lg font-semibold text-white sm:mt-3 sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 truncate text-xs text-slate-400 sm:text-sm">{hint}</p> : null}
    </div>
  );
}

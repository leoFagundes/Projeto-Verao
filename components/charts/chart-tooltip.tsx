type TooltipEntry = {
  name?: string;
  value?: number | string;
  color?: string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs shadow-xl">
      {label ? <p className="mb-1 text-slate-400">{label}</p> : null}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          {entry.color ? (
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          ) : null}
          <span className="font-semibold text-white">
            {entry.value}
            {suffix}
          </span>
          {entry.name ? <span className="text-slate-400">{entry.name}</span> : null}
        </div>
      ))}
    </div>
  );
}

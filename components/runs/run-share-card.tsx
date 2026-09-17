import { formatDateLong, formatDuration, formatPace } from "@/lib/utils";
import { RUN_TYPES, type Run } from "@/types/run";
import type { Profile } from "@/types/profile";

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-2)] px-2 py-2.5 text-center">
      <p className="text-base font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}

export function RunShareCard({ run, profile }: { run: Run; profile?: Profile | null }) {
  const typeMeta = RUN_TYPES.find((option) => option.key === run.type) ?? RUN_TYPES[0];
  const isTiro = run.type === "tiro" && run.repCount && run.repDistanceM;

  return (
    <div className="w-[min(380px,calc(100vw-5rem))] overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--surface)]">
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} />

      <div className="p-5 sm:p-6">
        <p
          className="truncate text-[10px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: "var(--accent)" }}
        >
          Projeto Verão{profile ? ` · ${profile.name}` : ""}
        </p>
        <h2 className="mt-0.5 flex items-center gap-2 break-words text-lg font-bold leading-tight text-white sm:text-xl">
          <typeMeta.icon className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
          {typeMeta.label}
        </h2>
        <p className="mt-2.5 text-xs font-medium text-slate-400">{formatDateLong(run.date)}</p>
      </div>

      <div className="border-t border-[var(--border)] p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-2">
          <StatBlock label="Distância" value={`${run.distanceKm.toFixed(2)} km`} />
          <StatBlock label="Duração" value={formatDuration(run.durationMin)} />
          {isTiro ? (
            <StatBlock label="Tiros" value={`${run.repCount}x${run.repDistanceM}m`} />
          ) : (
            <StatBlock label="Ritmo" value={formatPace(run.paceSecPerKm)} />
          )}
        </div>

        {run.note ? <p className="mt-4 text-xs italic text-slate-400">&ldquo;{run.note}&rdquo;</p> : null}
      </div>
    </div>
  );
}

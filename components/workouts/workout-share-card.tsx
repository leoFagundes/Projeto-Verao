import { formatDateLong, formatDuration } from "@/lib/utils";
import type { WorkoutSession } from "@/types/session";

function totalVolume(session: WorkoutSession) {
  return session.exercises.reduce((sum, log) => {
    return (
      sum +
      log.sets.reduce((setSum, set) => {
        if (!set.done || set.weight == null) return setSum;
        const reps = parseInt(set.reps, 10);
        return setSum + (Number.isFinite(reps) ? reps * set.weight : 0);
      }, 0)
    );
  }, 0);
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-2)] px-2 py-2.5 text-center">
      <p className="text-base font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}

export function WorkoutShareCard({ session }: { session: WorkoutSession }) {
  const totalSets = session.exercises.reduce((sum, log) => sum + log.sets.length, 0);
  const doneSets = session.exercises.reduce((sum, log) => sum + log.sets.filter((s) => s.done).length, 0);
  const volume = totalVolume(session);

  return (
    <div className="w-[380px] rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Projeto Verão
          </p>
          <h2 className="mt-1 truncate text-xl font-bold text-white">{session.workoutName}</h2>
        </div>
        <span className="shrink-0 text-2xl">🏋️</span>
      </div>

      <p className="mt-1.5 text-xs text-slate-400">
        {formatDateLong(session.date)} · {formatDuration(session.durationMin)}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatBlock label="Séries" value={`${doneSets}/${totalSets}`} />
        <StatBlock label="Exercícios" value={String(session.exercises.length)} />
        <StatBlock label="Volume" value={volume > 0 ? `${Math.round(volume)}kg` : "—"} />
      </div>

      <div className="mt-5 space-y-2.5">
        {session.exercises.map((log) => {
          const done = log.sets.filter((set) => set.done);
          return (
            <div key={log.id} className="border-t border-[var(--border)] pt-2.5">
              <p className="text-sm font-semibold text-white">{log.name}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {done.length > 0
                  ? done.map((set) => `${set.reps}${set.weight != null ? `×${set.weight}kg` : ""}`).join(" · ")
                  : "Não concluído"}
              </p>
            </div>
          );
        })}
      </div>

      {session.note ? (
        <p className="mt-4 text-xs italic text-slate-400">&ldquo;{session.note}&rdquo;</p>
      ) : null}
    </div>
  );
}

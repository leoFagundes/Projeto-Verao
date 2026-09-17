import { Clock, Dumbbell, Repeat } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { formatClock, formatDateLong, formatDuration } from "@/lib/utils";
import type { Profile } from "@/types/profile";
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

export function WorkoutShareCard({ session, profile }: { session: WorkoutSession; profile?: Profile | null }) {
  const totalSets = session.exercises.reduce((sum, log) => sum + log.sets.length, 0);
  const doneSets = session.exercises.reduce((sum, log) => sum + log.sets.filter((s) => s.done).length, 0);
  const volume = totalVolume(session);

  return (
    <div className="w-[min(380px,calc(100vw-5rem))] overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--surface)]">
      <div className="p-5 sm:p-6" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
        <div className="flex items-center gap-3">
          {profile ? (
            <Avatar
              name={profile.name}
              photoUrl={profile.photoUrl}
              className="h-11 w-11 shrink-0 rounded-2xl ring-2 ring-white/40"
              textClassName="text-sm"
            />
          ) : (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20 text-slate-950">
              <Dumbbell className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-950/70">
              Projeto Verão{profile ? ` · ${profile.name}` : ""}
            </p>
            <h2 className="mt-0.5 truncate text-xl font-bold text-slate-950">{session.workoutName}</h2>
          </div>
        </div>
        <p className="mt-2.5 text-xs font-medium text-slate-950/70">
          {formatDateLong(session.date)} · {formatDuration(session.durationMin)}
        </p>
      </div>

      <div className="p-5 sm:p-6">
      <div className="grid grid-cols-3 gap-2">
        <StatBlock label="Séries" value={`${doneSets}/${totalSets}`} />
        <StatBlock label="Exercícios" value={String(session.exercises.length)} />
        <StatBlock label="Volume" value={volume > 0 ? `${Math.round(volume)}kg` : "—"} />
      </div>

      <div className="mt-5 space-y-2.5">
        {session.exercises.map((log) => {
          const done = log.sets.filter((set) => set.done);
          const isTimeBased = done.some((set) => set.durationSeconds != null);
          const weights = done.map((set) => set.weight).filter((weight): weight is number => weight != null);
          const topWeight = weights.length > 0 ? Math.max(...weights) : null;

          return (
            <div key={log.id} className="border-t border-[var(--border)] pt-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 break-words text-sm font-semibold text-white">{log.name}</p>
                <span
                  className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]"
                  style={{ background: "var(--field-bg)", color: "var(--accent)" }}
                >
                  {isTimeBased ? <Clock className="h-2.5 w-2.5" /> : <Repeat className="h-2.5 w-2.5" />}
                  {isTimeBased ? "Tempo" : "Reps"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="break-words text-xs text-slate-400">
                  {done.length > 0
                    ? done.map((set) => (isTimeBased ? formatClock(set.durationSeconds ?? 0) : set.reps)).join(" · ")
                    : "Não concluído"}
                </p>
                {topWeight != null ? (
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-[var(--bg)]"
                    style={{ background: "var(--accent)" }}
                  >
                    <Dumbbell className="h-2.5 w-2.5" />
                    {topWeight}kg
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {session.note ? (
        <p className="mt-4 text-xs italic text-slate-400">&ldquo;{session.note}&rdquo;</p>
      ) : null}
      </div>
    </div>
  );
}

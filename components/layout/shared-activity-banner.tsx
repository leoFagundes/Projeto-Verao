"use client";

import { Dumbbell, Utensils, X } from "lucide-react";
import { FaRunning } from "react-icons/fa";

import { dismissDietShareNotice } from "@/lib/firebase/diets";
import { dismissSessionShareNotice } from "@/lib/firebase/sessions";
import { dismissRunShareNotice } from "@/lib/firebase/runs";
import { useDiets } from "@/lib/hooks/use-diets";
import { useRuns } from "@/lib/hooks/use-runs";
import { useSessions } from "@/lib/hooks/use-sessions";

/** Shown as soon as someone enters a profile that has treinos/corridas/dietas
 * another profile logged or created for it via "compartilhar" — a one-time
 * heads-up, dismissed per item, so a shared entry never just silently
 * appears in the history. */
export function SharedActivityBanner({ profileId }: { profileId: string }) {
  const { sessions } = useSessions(profileId);
  const { runs } = useRuns(profileId);
  const { diets } = useDiets(profileId);

  const sharedSessions = sessions.filter((session) => session.sharedByName);
  const sharedRuns = runs.filter((run) => run.sharedByName);
  const sharedDiets = diets.filter((diet) => diet.sharedByName);

  if (sharedSessions.length === 0 && sharedRuns.length === 0 && sharedDiets.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-3">
      <p className="px-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Novidades</p>
      <div className="mt-2 space-y-1.5">
        {sharedSessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between gap-2 rounded-xl bg-[var(--surface)] px-3 py-2 text-sm text-slate-200"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Dumbbell className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
              <span className="min-w-0 truncate">
                <span className="font-medium text-white">{session.sharedByName}</span> registrou o treino &ldquo;
                {session.workoutName}&rdquo; para você
              </span>
            </div>
            <button
              type="button"
              onClick={() => dismissSessionShareNotice(profileId, session.id)}
              className="shrink-0 text-slate-400 hover:text-white"
              aria-label="Dispensar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {sharedRuns.map((run) => (
          <div
            key={run.id}
            className="flex items-center justify-between gap-2 rounded-xl bg-[var(--surface)] px-3 py-2 text-sm text-slate-200"
          >
            <div className="flex min-w-0 items-center gap-2">
              <FaRunning className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
              <span className="min-w-0 truncate">
                <span className="font-medium text-white">{run.sharedByName}</span> registrou uma corrida de{" "}
                {run.distanceKm.toFixed(2)}km para você
              </span>
            </div>
            <button
              type="button"
              onClick={() => dismissRunShareNotice(profileId, run.id)}
              className="shrink-0 text-slate-400 hover:text-white"
              aria-label="Dispensar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {sharedDiets.map((diet) => (
          <div
            key={diet.id}
            className="flex items-center justify-between gap-2 rounded-xl bg-[var(--surface)] px-3 py-2 text-sm text-slate-200"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Utensils className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
              <span className="min-w-0 truncate">
                <span className="font-medium text-white">{diet.sharedByName}</span> criou a dieta &ldquo;{diet.name}
                &rdquo; para você
              </span>
            </div>
            <button
              type="button"
              onClick={() => dismissDietShareNotice(profileId, diet.id)}
              className="shrink-0 text-slate-400 hover:text-white"
              aria-label="Dispensar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

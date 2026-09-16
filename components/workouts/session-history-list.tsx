"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteSession } from "@/lib/firebase/sessions";
import { formatDateLong, formatDuration } from "@/lib/utils";
import type { WorkoutSession } from "@/types/session";

import { WorkoutShareModal } from "./workout-share-modal";

export function SessionHistoryList({
  profileId,
  sessions,
}: {
  profileId: string;
  sessions: WorkoutSession[];
}) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [sharing, setSharing] = useState<WorkoutSession | null>(null);

  if (sessions.length === 0) {
    return <EmptyState title="Nenhuma sessão registrada" description="Realize este treino para ver o histórico aqui." />;
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const totalSets = session.exercises.reduce((sum, e) => sum + e.sets.length, 0);
        const doneSets = session.exercises.reduce(
          (sum, e) => sum + e.sets.filter((set) => set.done).length,
          0,
        );

        return (
          <div
            key={session.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{formatDateLong(session.date)}</p>
              <p className="text-xs text-slate-400">
                {formatDuration(session.durationMin)} · {doneSets}/{totalSets} séries ·{" "}
                {session.exercises.length} exercícios
              </p>
              {session.note ? <p className="mt-1 text-xs text-slate-500">{session.note}</p> : null}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSharing(session)}
                className="text-xs font-medium text-[var(--accent)] hover:underline"
              >
                Compartilhar
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete(session.id)}
                className="text-xs font-medium text-red-300 hover:text-red-200"
              >
                Remover
              </button>
            </div>
          </div>
        );
      })}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remover sessão"
        description="Essa sessão será removida do histórico e das estatísticas. Essa ação não pode ser desfeita."
        confirmLabel="Remover"
        danger
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteSession(profileId, pendingDelete).catch(() =>
            toast.error("Não foi possível remover a sessão."),
          );
        }}
      />

      <WorkoutShareModal session={sharing} open={sharing !== null} onClose={() => setSharing(null)} />
    </div>
  );
}

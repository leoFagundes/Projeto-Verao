"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteDietHistoryEntry } from "@/lib/firebase/diets";
import { historySummary } from "@/lib/diet-stats";
import { formatDateLong } from "@/lib/utils";
import type { DietHistoryEntry } from "@/types/diet";

import { DietHistoryDetailModal } from "./diet-history-detail-modal";

export function DietHistoryList({ profileId, entries }: { profileId: string; entries: DietHistoryEntry[] }) {
  const [viewing, setViewing] = useState<DietHistoryEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DietHistoryEntry | null>(null);

  if (entries.length === 0) {
    return (
      <EmptyState
        title="Nenhum ciclo encerrado ainda"
        description="Quando você reiniciar ou encerrar uma dieta ativa, a semana realizada aparece aqui."
      />
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const summary = historySummary(entry);
        return (
          <div
            key={entry.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
          >
            <button
              type="button"
              onClick={() => setViewing(entry)}
              className="min-w-0 flex-1 text-left transition hover:opacity-80"
            >
              <p className="truncate text-sm font-medium text-white">{entry.dietName}</p>
              <p className="text-xs text-slate-400">
                {formatDateLong(entry.cycleStartedAt)} até {formatDateLong(entry.endedAt)}
              </p>
            </button>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs text-slate-300">
                {summary.done}/{summary.total} · {summary.adherence != null ? `${summary.adherence}%` : "—"}
              </span>
              <button
                type="button"
                onClick={() => setPendingDelete(entry)}
                className="text-xs font-medium text-red-300 hover:text-red-200"
              >
                Remover
              </button>
            </div>
          </div>
        );
      })}

      <DietHistoryDetailModal entry={viewing} open={viewing !== null} onClose={() => setViewing(null)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remover do histórico"
        description="Esse registro será removido permanentemente."
        confirmLabel="Remover"
        danger
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteDietHistoryEntry(profileId, pendingDelete.id).catch(() =>
            toast.error("Não foi possível remover."),
          );
        }}
      />
    </div>
  );
}

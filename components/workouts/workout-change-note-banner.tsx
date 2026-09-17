"use client";

import { Sparkles, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { dismissWorkoutChangeNote } from "@/lib/firebase/workouts";
import { formatDateLong } from "@/lib/utils";
import type { WorkoutChangeNote } from "@/types/workout";

function changeSummaryLine(note: WorkoutChangeNote) {
  const parts: string[] = [];
  if (note.addedNames.length > 0) {
    parts.push(`+${note.addedNames.length} exercício${note.addedNames.length === 1 ? "" : "s"}`);
  }
  if (note.removedNames.length > 0) {
    parts.push(`−${note.removedNames.length} exercício${note.removedNames.length === 1 ? "" : "s"}`);
  }
  if (note.renamed) parts.push("nome alterado");
  if (note.syncedFieldLabels.length > 0) parts.push(note.syncedFieldLabels.join(", "));
  return parts.join(" · ");
}

/** Shown on a linked workout when someone else's edit landed on this profile's
 * copy — a heads-up instead of a silent change, with an optional breakdown. */
export function WorkoutChangeNoteBanner({
  profileId,
  workoutId,
  note,
}: {
  profileId: string;
  workoutId: string;
  note: WorkoutChangeNote;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  function dismiss() {
    dismissWorkoutChangeNote(profileId, workoutId).catch(() => {});
  }

  return (
    <>
      <div className="mb-4 flex items-start gap-2 rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-3 text-sm text-slate-200">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
        <div className="min-w-0 flex-1">
          <p>
            <span className="font-medium text-white">{note.changedByName}</span> atualizou este treino
          </p>
          {changeSummaryLine(note) ? <p className="mt-0.5 text-xs text-slate-400">{changeSummaryLine(note)}</p> : null}
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="mt-1.5 text-xs font-medium text-[var(--accent)] hover:underline"
          >
            Ver o que mudou
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-slate-400 hover:text-white"
          aria-label="Dispensar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="O que mudou">
        <p className="text-sm text-slate-300">
          <span className="font-medium text-white">{note.changedByName}</span> atualizou este treino em{" "}
          {formatDateLong(note.changedAt)}.
        </p>
        <div className="mt-4 space-y-3 text-sm">
          {note.renamed ? <p className="text-slate-300">✏️ O nome do treino mudou.</p> : null}
          {note.addedNames.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-emerald-400">Adicionados</p>
              <ul className="mt-1 space-y-0.5 text-slate-200">
                {note.addedNames.map((name) => (
                  <li key={name}>+ {name}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {note.removedNames.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-red-300">Removidos</p>
              <ul className="mt-1 space-y-0.5 text-slate-200">
                {note.removedNames.map((name) => (
                  <li key={name}>− {name}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {note.syncedFieldLabels.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--accent)]">Também atualizado</p>
              <p className="mt-1 text-slate-200">{note.syncedFieldLabels.join(", ")}</p>
            </div>
          ) : null}
        </div>
        <Button
          className="mt-5 w-full"
          onClick={() => {
            setDetailsOpen(false);
            dismiss();
          }}
        >
          Ok, entendi
        </Button>
      </Modal>
    </>
  );
}

"use client";

import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  ALL_PERSONAL_FIELDS,
  PERSONAL_EXERCISE_FIELDS,
  PERSONAL_FIELD_LABELS,
  type PersonalExerciseField,
} from "@/lib/workout-sync";
import type { Profile } from "@/types/profile";

const STORAGE_PREFIX = "projeto-verao-sync-fields:";

function loadSavedFields(workoutId: string): Set<PersonalExerciseField> {
  if (typeof window === "undefined") return new Set(ALL_PERSONAL_FIELDS);
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + workoutId);
    if (!raw) return new Set(ALL_PERSONAL_FIELDS);
    const parsed = JSON.parse(raw) as string[];
    const valid = parsed.filter((field): field is PersonalExerciseField =>
      (PERSONAL_EXERCISE_FIELDS as readonly string[]).includes(field),
    );
    return new Set(valid);
  } catch {
    return new Set(ALL_PERSONAL_FIELDS);
  }
}

/** Shown when saving a change to a workout that's linked to other profiles.
 * Structure (exercises, order, name) always syncs — that's the point of
 * staying linked — but per-exercise prescription fields (sets/reps/weight/
 * rest/notes/duration) are personal, so the user picks which of those should
 * sync too, defaulting to all of them (or their last choice for this
 * workout, remembered locally). "Só neste perfil" breaks the link entirely. */
export function LinkEditChoiceModal({
  open,
  workoutId,
  linkedProfiles,
  onClose,
  onSync,
  onUnlinkAndSave,
}: {
  open: boolean;
  workoutId: string;
  linkedProfiles: Profile[];
  onClose: () => void;
  onSync: (fields: Set<PersonalExerciseField>) => void;
  onUnlinkAndSave: () => void;
}) {
  const [fields, setFields] = useState<Set<PersonalExerciseField>>(() => loadSavedFields(workoutId));

  function toggleField(field: PersonalExerciseField) {
    setFields((current) => {
      const next = new Set(current);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      try {
        localStorage.setItem(STORAGE_PREFIX + workoutId, JSON.stringify([...next]));
      } catch {
        // Best-effort — worst case the choice just isn't remembered next time.
      }
      return next;
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Aplicar alteração a perfis vinculados?">
      <p className="text-sm text-slate-300">Este treino está vinculado com:</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {linkedProfiles.map((profile) => (
          <span
            key={profile.id}
            className="flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] py-1 pl-1 pr-2.5 text-xs text-slate-200"
          >
            <Avatar name={profile.name} photoUrl={profile.photoUrl} className="h-5 w-5 rounded-full" textClassName="text-[9px]" />
            {profile.name}
          </span>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Exercícios, ordem e nome do treino sempre são sincronizados. Escolha quais campos pessoais também
        devem valer pra eles:
      </p>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {PERSONAL_EXERCISE_FIELDS.map((field) => {
          const checked = fields.has(field);
          return (
            <button
              key={field}
              type="button"
              onClick={() => toggleField(field)}
              aria-pressed={checked}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left"
            >
              <span
                className="grid h-4 w-4 shrink-0 place-items-center rounded border-2 text-[10px] font-bold"
                style={
                  checked
                    ? { borderColor: "var(--accent)", backgroundColor: "var(--accent)", color: "var(--bg)" }
                    : { borderColor: "var(--border-strong)", color: "transparent" }
                }
              >
                ✓
              </span>
              <span className="text-xs text-slate-200">{PERSONAL_FIELD_LABELS[field]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-2.5">
        <button
          type="button"
          onClick={() => onSync(fields)}
          className="w-full rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-3.5 text-left transition hover:brightness-110"
        >
          <p className="text-sm font-semibold text-white">Salvar e sincronizar</p>
          <p className="mt-0.5 text-xs text-slate-300">
            Estrutura sempre vai junto; os campos marcados acima também. O vínculo continua.
          </p>
        </button>
        <button
          type="button"
          onClick={onUnlinkAndSave}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5 text-left transition hover:border-[var(--border-strong)]"
        >
          <p className="text-sm font-semibold text-white">Só neste perfil</p>
          <p className="mt-0.5 text-xs text-slate-300">
            A alteração fica só aqui e o vínculo com esses perfis é desfeito agora.
          </p>
        </button>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Modal>
  );
}

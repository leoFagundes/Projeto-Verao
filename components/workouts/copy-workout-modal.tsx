"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { copyWorkout } from "@/lib/firebase/workouts";
import { useProfiles } from "@/lib/hooks/use-profiles";
import type { Workout } from "@/types/workout";

export function CopyWorkoutModal({
  open,
  onClose,
  profileId,
  workout,
  onCopied,
}: {
  open: boolean;
  onClose: () => void;
  profileId: string;
  workout: Workout;
  onCopied: (targetProfileId: string, newWorkoutId: string) => void;
}) {
  const { profiles } = useProfiles();
  const [copyingId, setCopyingId] = useState<string | null>(null);

  async function handleCopy(targetProfileId: string, targetName: string) {
    if (copyingId) return;
    setCopyingId(targetProfileId);
    try {
      const newId = await copyWorkout(profileId, targetProfileId, workout);
      const sameProfile = targetProfileId === profileId;
      toast.success(sameProfile ? "Treino duplicado!" : `Treino copiado para ${targetName}!`);
      onCopied(targetProfileId, newId);
      onClose();
    } catch {
      toast.error("Não foi possível copiar o treino.");
    } finally {
      setCopyingId(null);
    }
  }

  const ordered = [...profiles].sort((a, b) => (a.id === profileId ? -1 : b.id === profileId ? 1 : 0));

  return (
    <Modal open={open} onClose={onClose} title={`Copiar "${workout.name}"`}>
      <p className="text-sm text-slate-400">Escolha para qual perfil copiar este treino.</p>
      <div className="mt-4 space-y-2">
        {ordered.map((profile) => {
          const isSelf = profile.id === profileId;
          return (
            <button
              key={profile.id}
              type="button"
              disabled={copyingId !== null}
              onClick={() => handleCopy(profile.id, profile.name)}
              className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left transition hover:border-[var(--accent)] disabled:opacity-50"
            >
              <Avatar
                name={profile.name}
                photoUrl={profile.photoUrl}
                className="h-11 w-11 shrink-0 rounded-xl"
                textClassName="text-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{profile.name}</p>
                <p className="text-xs text-slate-400">
                  {isSelf ? "Duplicar neste perfil" : "Copiar para este perfil"}
                </p>
              </div>
              {copyingId === profile.id ? (
                <span className="shrink-0 text-xs text-slate-400">Copiando...</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

"use client";

import { Info, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { copyWorkout } from "@/lib/firebase/workouts";
import { useWorkouts } from "@/lib/hooks/use-workouts";
import type { Profile } from "@/types/profile";
import type { Workout } from "@/types/workout";

import { LinkToggle } from "./link-toggle";

type TemplateGroup = {
  key: string;
  profileNames: string[];
  ownerProfileId: string;
  workout: Workout;
  hasCurrentProfile: boolean;
};

/** Invisible data loader — keeps the `useWorkouts(profile.id)` hook at one
 * stable call site per profile and reports results up to the parent so it
 * can merge everyone's workouts into cross-profile template groups. */
function WorkoutsLoader({
  profileId,
  onData,
}: {
  profileId: string;
  onData: (profileId: string, workouts: Workout[], loading: boolean) => void;
}) {
  const { workouts, loading } = useWorkouts(profileId);

  useEffect(() => {
    onData(profileId, workouts, loading);
  }, [profileId, workouts, loading, onData]);

  return null;
}

function TemplateListSkeleton() {
  return (
    <div className="mt-4 space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[4.25rem] animate-pulse rounded-2xl bg-white/5" />
      ))}
    </div>
  );
}

function buildGroups(
  profiles: Profile[],
  currentProfileId: string,
  workoutsByProfile: Record<string, Workout[]>,
): TemplateGroup[] {
  const index = new Map<string, { profileId: string; workout: Workout }>();
  for (const profile of profiles) {
    for (const workout of workoutsByProfile[profile.id] ?? []) {
      index.set(`${profile.id}:${workout.id}`, { profileId: profile.id, workout });
    }
  }

  const nameById = new Map(profiles.map((profile) => [profile.id, profile.name]));
  const seen = new Set<string>();
  const groups: TemplateGroup[] = [];

  for (const [key, entry] of index) {
    if (seen.has(key)) continue;
    const memberKeys = [key, ...entry.workout.linkedWorkouts.map((ref) => `${ref.profileId}:${ref.workoutId}`)];
    const members = memberKeys
      .map((memberKey) => index.get(memberKey))
      .filter((member): member is { profileId: string; workout: Workout } => Boolean(member));
    for (const member of members) seen.add(`${member.profileId}:${member.workout.id}`);

    groups.push({
      key: [...memberKeys].sort().join("|"),
      profileNames: members.map((member) => nameById.get(member.profileId) ?? "?"),
      ownerProfileId: entry.profileId,
      workout: entry.workout,
      hasCurrentProfile: members.some((member) => member.profileId === currentProfileId),
    });
  }

  return groups.sort((a, b) => {
    if (a.hasCurrentProfile !== b.hasCurrentProfile) return a.hasCurrentProfile ? -1 : 1;
    return a.workout.name.localeCompare(b.workout.name, "pt-BR");
  });
}

function TemplatePreviewModal({ group, onClose, onUse }: { group: TemplateGroup; onClose: () => void; onUse: () => void }) {
  const activeExercises = group.workout.exercises.filter((exercise) => !exercise.hidden);

  return (
    <Modal open onClose={onClose} title={group.workout.name}>
      <p className="text-xs text-slate-400">{group.profileNames.join(" · ")}</p>
      <div className="mt-4 space-y-2">
        {activeExercises.map((exercise) => (
          <div key={exercise.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--field-bg)] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm text-white">{exercise.name}</p>
              {exercise.muscleGroup ? <p className="text-xs text-slate-500">{exercise.muscleGroup}</p> : null}
            </div>
            <span className="shrink-0 text-xs text-slate-400">
              {exercise.sets}x{exercise.measureType === "time" ? `${exercise.durationSeconds ?? "—"}s` : exercise.reps}
              {exercise.weight ? ` · ${exercise.weight}kg` : ""}
            </span>
          </div>
        ))}
      </div>
      <Button className="mt-5 w-full" onClick={onUse}>
        Usar este modelo
      </Button>
    </Modal>
  );
}

/** Lets you start a new workout from any profile's existing plan instead of
 * building from scratch — with the choice to keep it linked (future edits
 * can sync) or take an independent, unlinked copy. Workouts already linked
 * across profiles are shown once, with every profile that has them listed
 * together, instead of repeating the same plan per profile. */
export function TemplatePickerModal({
  open,
  onClose,
  currentProfileId,
  profiles,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  currentProfileId: string;
  profiles: Profile[];
  onCreated: (newWorkoutId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [linked, setLinked] = useState(true);
  const [creating, setCreating] = useState(false);
  const [previewGroup, setPreviewGroup] = useState<TemplateGroup | null>(null);
  const [workoutsByProfile, setWorkoutsByProfile] = useState<Record<string, Workout[]>>({});
  const [loadingByProfile, setLoadingByProfile] = useState<Record<string, boolean>>({});

  const handleData = useCallback((profileId: string, workouts: Workout[], loading: boolean) => {
    setWorkoutsByProfile((current) => ({ ...current, [profileId]: workouts }));
    setLoadingByProfile((current) => ({ ...current, [profileId]: loading }));
  }, []);

  const groups = useMemo(
    () => buildGroups(profiles, currentProfileId, workoutsByProfile),
    [profiles, currentProfileId, workoutsByProfile],
  );
  const stillLoading = profiles.some((profile) => loadingByProfile[profile.id] !== false);

  const query = search.trim().toLowerCase();
  const filteredGroups = groups.filter((group) => group.workout.name.toLowerCase().includes(query));

  async function handlePick(group: TemplateGroup) {
    if (creating) return;
    setCreating(true);
    try {
      const sameProfile = group.ownerProfileId === currentProfileId;
      const newId = await copyWorkout(group.ownerProfileId, currentProfileId, group.workout, {
        linked: linked && !sameProfile,
      });
      toast.success(`Treino criado a partir de "${group.workout.name}"!`);
      setPreviewGroup(null);
      onCreated(newId);
    } catch {
      toast.error("Não foi possível usar esse modelo.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Usar modelo existente">
      {profiles.map((profile) => (
        <WorkoutsLoader key={profile.id} profileId={profile.id} onData={handleData} />
      ))}

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar treino de qualquer perfil..."
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--field-bg)] py-2.5 pl-11 pr-4 text-sm text-white outline-none focus:border-[var(--accent)]"
        />
      </div>

      <LinkToggle checked={linked} onChange={setLinked} />

      {stillLoading ? (
        <TemplateListSkeleton />
      ) : (
        <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {filteredGroups.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Nenhum treino encontrado.</p>
          ) : null}
          {filteredGroups.map((group) => {
            const activeCount = group.workout.exercises.filter((exercise) => !exercise.hidden).length;
            return (
              <div
                key={group.key}
                className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
              >
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => handlePick(group)}
                  className="min-w-0 flex-1 text-left disabled:opacity-50"
                >
                  <span className="block truncate text-xs uppercase tracking-[0.1em] text-[var(--accent)]">
                    {group.profileNames.join(" / ")}
                  </span>
                  <span className="block truncate text-sm font-medium text-white">{group.workout.name}</span>
                  <span className="text-xs text-slate-400">
                    {activeCount} exercício{activeCount === 1 ? "" : "s"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewGroup(group)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:text-[var(--accent)]"
                  aria-label="Ver detalhes do treino"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {previewGroup ? (
        <TemplatePreviewModal
          group={previewGroup}
          onClose={() => setPreviewGroup(null)}
          onUse={() => handlePick(previewGroup)}
        />
      ) : null}
    </Modal>
  );
}

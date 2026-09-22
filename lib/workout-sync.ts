import type { Exercise, WorkoutChangeNote } from "@/types/workout";

/** Per-exercise fields that are personal prescription data (how much/how long
 * YOU do it) rather than the shared shape of the workout. Syncing any of
 * these to linked profiles is opt-in, chosen at save time. */
export const PERSONAL_EXERCISE_FIELDS = ["sets", "reps", "weight", "restSeconds", "notes", "durationSeconds"] as const;
export type PersonalExerciseField = (typeof PERSONAL_EXERCISE_FIELDS)[number];

export const PERSONAL_FIELD_LABELS: Record<PersonalExerciseField, string> = {
  sets: "Séries",
  reps: "Repetições",
  weight: "Carga",
  restSeconds: "Descanso",
  notes: "Notas do exercício",
  durationSeconds: "Duração alvo",
};

/**
 * Builds the exercises array to write to one linked profile. Structure —
 * which exercises exist, their order, superset links, which exercise-library
 * item each one is — always comes from the edited source, since that's the
 * whole point of staying linked. For an exercise that already existed for
 * this target profile (matched by its stable `id`), personal prescription
 * fields are kept as they were unless explicitly included in `syncFields`.
 * A brand-new exercise has no prior personal value to preserve, so it's
 * copied over as-is; a removed exercise simply isn't in the result.
 */
export function mergeLinkedExercises(
  sourceExercises: Exercise[],
  targetExercises: Exercise[],
  syncFields: Set<PersonalExerciseField>,
): Exercise[] {
  const targetById = new Map(targetExercises.map((exercise) => [exercise.id, exercise]));

  return sourceExercises.map((source) => {
    const target = targetById.get(source.id);
    if (!target) return source;

    return {
      ...source,
      sets: syncFields.has("sets") ? source.sets : target.sets,
      reps: syncFields.has("reps") ? source.reps : target.reps,
      weight: syncFields.has("weight") ? source.weight : target.weight,
      restSeconds: syncFields.has("restSeconds") ? source.restSeconds : target.restSeconds,
      notes: syncFields.has("notes") ? source.notes : target.notes,
      durationSeconds: syncFields.has("durationSeconds") ? source.durationSeconds : target.durationSeconds,
    };
  });
}

/**
 * Describes what a linked edit actually changes for one target profile, so
 * they can get a heads-up instead of a silent change — or `null` if nothing
 * worth flagging happened (e.g. the edit only touched fields that weren't
 * chosen to sync). Exercises are matched by their stable `id`.
 */
export function summarizeWorkoutChange({
  changedByProfileId,
  changedByName,
  sourceName,
  targetNameBefore,
  sourceExercises,
  targetExercisesBefore,
  syncedFields,
}: {
  changedByProfileId: string;
  changedByName: string;
  sourceName: string;
  targetNameBefore: string;
  sourceExercises: Exercise[];
  targetExercisesBefore: Exercise[];
  syncedFields: Set<PersonalExerciseField>;
}): WorkoutChangeNote | null {
  const sourceIds = new Set(sourceExercises.map((exercise) => exercise.id));
  const targetIds = new Set(targetExercisesBefore.map((exercise) => exercise.id));
  const addedNames = sourceExercises.filter((exercise) => !targetIds.has(exercise.id)).map((exercise) => exercise.name);
  const removedNames = targetExercisesBefore
    .filter((exercise) => !sourceIds.has(exercise.id))
    .map((exercise) => exercise.name);
  const renamed = sourceName !== targetNameBefore;
  const syncedFieldLabels = [...syncedFields].map((field) => PERSONAL_FIELD_LABELS[field]);

  if (addedNames.length === 0 && removedNames.length === 0 && !renamed && syncedFieldLabels.length === 0) {
    return null;
  }

  return {
    changedByProfileId,
    changedByName,
    changedAt: Date.now(),
    addedNames,
    removedNames,
    renamed,
    syncedFieldLabels,
  };
}

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { generateId } from "@/lib/utils";
import { mergeLinkedExercises, summarizeWorkoutChange, type PersonalExerciseField } from "@/lib/workout-sync";
import type { Exercise, Workout, WorkoutInput, WorkoutLinkRef } from "@/types/workout";

import { db } from "./client";

function requireDb() {
  if (!db) {
    throw new Error(
      "Firebase não está configurado. Configure as variáveis de ambiente para continuar.",
    );
  }
  return db;
}

function workoutsRef(profileId: string) {
  return collection(requireDb(), "profiles", profileId, "workouts");
}

/** Reads pre-multi-image exercise entries (`imageUrl`) as a one-item `images` array. */
function normalizeStoredExercise(exercise: Record<string, unknown>): Exercise {
  const legacyImageUrl = exercise.imageUrl as string | null | undefined;
  return {
    id: exercise.id as string,
    exerciseId: exercise.exerciseId as string,
    name: exercise.name as string,
    sets: exercise.sets as number,
    reps: exercise.reps as string,
    durationSeconds: (exercise.durationSeconds as number | null) ?? null,
    measureType: (exercise.measureType as Exercise["measureType"]) ?? "reps",
    trackWeight: (exercise.trackWeight as boolean | undefined) ?? true,
    weight: (exercise.weight as number | null) ?? null,
    restSeconds: (exercise.restSeconds as number | null) ?? null,
    muscleGroup: (exercise.muscleGroup as Exercise["muscleGroup"]) ?? null,
    images: (exercise.images as string[] | undefined) ?? (legacyImageUrl ? [legacyImageUrl] : []),
    videoUrl: (exercise.videoUrl as string | null | undefined) ?? null,
    notes: (exercise.notes as string) ?? "",
    hidden: (exercise.hidden as boolean) ?? false,
    linkedToNext: (exercise.linkedToNext as boolean) ?? false,
  };
}

export function subscribeWorkouts(
  profileId: string,
  onData: (workouts: Workout[]) => void,
  onError?: (error: Error) => void,
) {
  if (!db) return () => {};

  const q = query(workoutsRef(profileId), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<Workout, "id" | "exercises" | "linkedWorkouts" | "pendingChangeNote" | "ownerProfileId"> & {
            exercises: Record<string, unknown>[];
            linkedWorkouts?: WorkoutLinkRef[];
            pendingChangeNote?: Workout["pendingChangeNote"];
            ownerProfileId?: string;
          };
          return {
            id: docSnap.id,
            ...data,
            category: data.category ?? null,
            exercises: data.exercises.map(normalizeStoredExercise),
            linkedWorkouts: data.linkedWorkouts ?? [],
            pendingChangeNote: data.pendingChangeNote ?? null,
            // Falls back to "I own my own copy" for any workout the migration
            // hasn't (yet) stamped with a real owner — fails toward the safer
            // side, since it just means sync stays unavailable until then.
            ownerProfileId: data.ownerProfileId ?? profileId,
          };
        }),
      );
    },
    (error) => onError?.(error),
  );
}

function normalizeExercises(exercises: WorkoutInput["exercises"]) {
  return exercises.map((exercise) => ({
    ...exercise,
    id: exercise.id ?? generateId(),
    hidden: exercise.hidden ?? false,
    images: exercise.images ?? [],
    videoUrl: exercise.videoUrl ?? null,
    linkedToNext: exercise.linkedToNext ?? false,
    measureType: exercise.measureType ?? "reps",
    durationSeconds: exercise.durationSeconds ?? null,
    trackWeight: exercise.trackWeight ?? true,
  }));
}

export async function createWorkout(
  profileId: string,
  input: WorkoutInput,
  options?: { ownerProfileId?: string },
) {
  const now = Date.now();
  const docRef = await addDoc(workoutsRef(profileId), {
    name: input.name,
    category: input.category,
    exercises: normalizeExercises(input.exercises),
    createdAt: now,
    updatedAt: now,
    lastPerformedAt: null,
    linkedWorkouts: [],
    pendingChangeNote: null,
    // The creator owns it by default — copyWorkout overrides this to the
    // original source's owner for a *linked* copy, since a copy isn't a new
    // original.
    ownerProfileId: options?.ownerProfileId ?? profileId,
  });
  return docRef.id;
}

export async function updateWorkout(
  profileId: string,
  workoutId: string,
  input: WorkoutInput,
) {
  await updateDoc(doc(requireDb(), "profiles", profileId, "workouts", workoutId), {
    name: input.name,
    category: input.category,
    exercises: normalizeExercises(input.exercises),
    updatedAt: Date.now(),
  });
}

/** Saves an edit, always syncing the workout's structure (which exercises,
 * their order, name/category) to every linked profile, while each of their
 * personal prescription fields (sets/reps/weight/rest/notes/duration) is only
 * overwritten for the categories listed in `syncFields` — anything else stays
 * exactly as that profile already had it. Also leaves each target a short
 * change note (who, what changed) so it isn't a silent surprise next time
 * they open it. */
export async function propagateWorkoutEdit(
  profileId: string,
  workoutId: string,
  input: WorkoutInput,
  linkedWorkouts: WorkoutLinkRef[],
  syncFields: Set<PersonalExerciseField>,
  changedBy: { profileId: string; name: string },
  ownerProfileId: string,
) {
  // Defense in depth to match the UI gate — this whole app trusts the
  // client for its business rules already (no server), but the check still
  // belongs here, not just in the page, so nothing can call this function
  // and skip it by accident.
  if (changedBy.profileId !== ownerProfileId) {
    throw new Error("Só quem criou o treino pode sincronizar alterações com o grupo vinculado.");
  }

  const sourceExercises = normalizeExercises(input.exercises) as Exercise[];
  await updateWorkout(profileId, workoutId, input);

  await Promise.all(
    linkedWorkouts.map(async (ref) => {
      try {
        const targetDoc = doc(requireDb(), "profiles", ref.profileId, "workouts", ref.workoutId);
        const targetSnap = await getDoc(targetDoc);
        if (!targetSnap.exists()) return;
        const targetData = targetSnap.data() as { name?: string; exercises?: Record<string, unknown>[] };
        const targetExercises = (targetData.exercises ?? []).map(normalizeStoredExercise);
        const mergedExercises = mergeLinkedExercises(sourceExercises, targetExercises, syncFields);

        const changeNote = summarizeWorkoutChange({
          changedByProfileId: changedBy.profileId,
          changedByName: changedBy.name,
          sourceName: input.name,
          targetNameBefore: targetData.name ?? input.name,
          sourceExercises,
          targetExercisesBefore: targetExercises,
          syncedFields: syncFields,
        });

        await updateDoc(targetDoc, {
          name: input.name,
          category: input.category,
          exercises: normalizeExercises(mergedExercises),
          updatedAt: Date.now(),
          ...(changeNote ? { pendingChangeNote: changeNote } : {}),
        });
      } catch {
        // Best-effort — one unreachable linked profile shouldn't block the rest.
      }
    }),
  );
}

export async function dismissWorkoutChangeNote(profileId: string, workoutId: string) {
  await updateDoc(doc(requireDb(), "profiles", profileId, "workouts", workoutId), {
    pendingChangeNote: null,
  });
}

/** Saves an edit only to this profile's copy and leaves the link group —
 * every other member keeps their link to each other, just not to this one.
 * This copy also becomes its own owner: once it's out of the group, there's
 * no group left for the old owner to sync into it anyway. */
export async function updateWorkoutAndUnlink(
  profileId: string,
  workoutId: string,
  input: WorkoutInput,
  linkedWorkouts: WorkoutLinkRef[],
) {
  await updateWorkout(profileId, workoutId, input);
  await updateDoc(doc(requireDb(), "profiles", profileId, "workouts", workoutId), {
    linkedWorkouts: [],
    ownerProfileId: profileId,
  });
  const myRef: WorkoutLinkRef = { profileId, workoutId };
  await Promise.all(
    linkedWorkouts.map((ref) =>
      updateDoc(doc(requireDb(), "profiles", ref.profileId, "workouts", ref.workoutId), {
        linkedWorkouts: arrayRemove(myRef),
      }).catch(() => {}),
    ),
  );
}

export async function touchWorkoutPerformed(profileId: string, workoutId: string) {
  await updateDoc(doc(requireDb(), "profiles", profileId, "workouts", workoutId), {
    lastPerformedAt: Date.now(),
  });
}

export async function setExerciseHidden(
  profileId: string,
  workoutId: string,
  workout: Workout,
  exerciseId: string,
  hidden: boolean,
) {
  const exercises = workout.exercises.map((exercise) =>
    exercise.id === exerciseId ? { ...exercise, hidden } : exercise,
  );
  await updateDoc(doc(requireDb(), "profiles", profileId, "workouts", workoutId), {
    exercises,
    updatedAt: Date.now(),
  });
}

export async function copyWorkout(
  sourceProfileId: string,
  targetProfileId: string,
  workout: Workout,
  options?: { linked?: boolean },
) {
  const sameProfile = sourceProfileId === targetProfileId;
  const linked = Boolean(options?.linked) && !sameProfile;

  const newWorkoutId = await createWorkout(
    targetProfileId,
    {
      name: sameProfile ? `${workout.name} (cópia)` : workout.name,
      category: workout.category,
      exercises: workout.exercises,
    },
    // A linked copy traces ownership back to the original creator (not
    // whoever it was copied from, and not the new profile) — that's who
    // gets to push synced edits to the whole group. An unlinked copy is a
    // clean break, so it owns itself like any other new workout.
    { ownerProfileId: linked ? workout.ownerProfileId : targetProfileId },
  );

  if (linked) {
    // The new copy joins the whole existing group (the source plus whoever it was already linked to).
    const group: WorkoutLinkRef[] = [
      { profileId: sourceProfileId, workoutId: workout.id },
      ...workout.linkedWorkouts,
    ];
    await updateDoc(doc(requireDb(), "profiles", targetProfileId, "workouts", newWorkoutId), {
      linkedWorkouts: group,
    });

    // Every existing group member gains a reference back to the new copy.
    const newRef: WorkoutLinkRef = { profileId: targetProfileId, workoutId: newWorkoutId };
    await Promise.all(
      group.map((ref) =>
        updateDoc(doc(requireDb(), "profiles", ref.profileId, "workouts", ref.workoutId), {
          linkedWorkouts: arrayUnion(newRef),
        }).catch(() => {}),
      ),
    );
  }

  return newWorkoutId;
}

/** Legacy default owner for pre-existing linked workouts that predate
 * `ownerProfileId` — there's no historical record of who created them
 * first, so this is a one-time human call for the migration below. */
const LEGACY_LINKED_WORKOUT_OWNER = "QTzJro6mu7aHOMfGmkI2";

/**
 * One-time migration: stamps `ownerProfileId` onto every workout that
 * predates it. A workout that's part of a link group gets the legacy
 * default owner above; a workout that was never linked owns itself (that
 * doesn't change anything for it — ownership only matters within a group).
 * Purely additive, only touches docs missing the field, safe to re-run.
 */
export async function migrateWorkoutOwnership() {
  const database = requireDb();
  const snapshot = await getDocs(collectionGroup(database, "workouts"));

  let updated = 0;
  let batch = writeBatch(database);
  let batchCount = 0;

  for (const workoutDoc of snapshot.docs) {
    const data = workoutDoc.data() as { ownerProfileId?: string; linkedWorkouts?: WorkoutLinkRef[] };
    if (data.ownerProfileId) continue;

    const profileId = workoutDoc.ref.parent.parent?.id;
    if (!profileId) continue;

    const ownerProfileId =
      (data.linkedWorkouts?.length ?? 0) > 0 ? LEGACY_LINKED_WORKOUT_OWNER : profileId;

    batch.update(workoutDoc.ref, { ownerProfileId });
    batchCount += 1;
    updated += 1;

    if (batchCount >= 400) {
      await batch.commit();
      batch = writeBatch(database);
      batchCount = 0;
    }
  }

  if (batchCount > 0) await batch.commit();
  return { updated, total: snapshot.size };
}

export async function deleteWorkout(profileId: string, workout: Workout) {
  if (workout.linkedWorkouts.length > 0) {
    const myRef: WorkoutLinkRef = { profileId, workoutId: workout.id };
    await Promise.all(
      workout.linkedWorkouts.map((ref) =>
        updateDoc(doc(requireDb(), "profiles", ref.profileId, "workouts", ref.workoutId), {
          linkedWorkouts: arrayRemove(myRef),
        }).catch(() => {}),
      ),
    );
  }
  await deleteDoc(doc(requireDb(), "profiles", profileId, "workouts", workout.id));
}

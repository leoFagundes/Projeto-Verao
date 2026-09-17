import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { generateId } from "@/lib/utils";
import { mergeLinkedExercises, type PersonalExerciseField } from "@/lib/workout-sync";
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
          const data = docSnap.data() as Omit<Workout, "id" | "exercises" | "linkedWorkouts"> & {
            exercises: Record<string, unknown>[];
            linkedWorkouts?: WorkoutLinkRef[];
          };
          return {
            id: docSnap.id,
            ...data,
            category: data.category ?? null,
            exercises: data.exercises.map(normalizeStoredExercise),
            linkedWorkouts: data.linkedWorkouts ?? [],
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
  }));
}

export async function createWorkout(profileId: string, input: WorkoutInput) {
  const now = Date.now();
  const docRef = await addDoc(workoutsRef(profileId), {
    name: input.name,
    category: input.category,
    exercises: normalizeExercises(input.exercises),
    createdAt: now,
    updatedAt: now,
    lastPerformedAt: null,
    linkedWorkouts: [],
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
 * exactly as that profile already had it. */
export async function propagateWorkoutEdit(
  profileId: string,
  workoutId: string,
  input: WorkoutInput,
  linkedWorkouts: WorkoutLinkRef[],
  syncFields: Set<PersonalExerciseField>,
) {
  const sourceExercises = normalizeExercises(input.exercises) as Exercise[];
  await updateWorkout(profileId, workoutId, input);

  await Promise.all(
    linkedWorkouts.map(async (ref) => {
      try {
        const targetDoc = doc(requireDb(), "profiles", ref.profileId, "workouts", ref.workoutId);
        const targetSnap = await getDoc(targetDoc);
        if (!targetSnap.exists()) return;
        const targetData = targetSnap.data() as { exercises?: Record<string, unknown>[] };
        const targetExercises = (targetData.exercises ?? []).map(normalizeStoredExercise);
        const mergedExercises = mergeLinkedExercises(sourceExercises, targetExercises, syncFields);

        await updateWorkout(ref.profileId, ref.workoutId, {
          name: input.name,
          category: input.category,
          exercises: mergedExercises,
        });
      } catch {
        // Best-effort — one unreachable linked profile shouldn't block the rest.
      }
    }),
  );
}

/** Saves an edit only to this profile's copy and leaves the link group —
 * every other member keeps their link to each other, just not to this one. */
export async function updateWorkoutAndUnlink(
  profileId: string,
  workoutId: string,
  input: WorkoutInput,
  linkedWorkouts: WorkoutLinkRef[],
) {
  await updateWorkout(profileId, workoutId, input);
  await updateDoc(doc(requireDb(), "profiles", profileId, "workouts", workoutId), {
    linkedWorkouts: [],
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

  const newWorkoutId = await createWorkout(targetProfileId, {
    name: sameProfile ? `${workout.name} (cópia)` : workout.name,
    category: workout.category,
    exercises: workout.exercises,
  });

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

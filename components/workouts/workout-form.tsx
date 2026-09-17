"use client";

import { Reorder } from "framer-motion";
import { Link2Off, Plus } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { generateId } from "@/lib/utils";
import type { ExerciseDef } from "@/types/exercise";
import type { WorkoutInput } from "@/types/workout";

import { ExercisePicker } from "./exercise-picker";
import { ExerciseRow, type FormExercise } from "./exercise-row";

function exerciseFromDef(def: ExerciseDef): FormExercise {
  return {
    id: generateId(),
    exerciseId: def.id,
    name: def.name,
    sets: 3,
    reps: "10-12",
    durationSeconds: null,
    measureType: "reps",
    trackWeight: true,
    weight: null,
    restSeconds: 60,
    muscleGroup: def.muscleGroup,
    images: def.images,
    videoUrl: def.videoUrl,
    notes: "",
    hidden: false,
    linkedToNext: false,
  };
}

export function WorkoutForm({
  initialValues,
  submitLabel = "Salvar treino",
  onSubmit,
  onCancel,
}: {
  initialValues?: WorkoutInput;
  submitLabel?: string;
  onSubmit: (values: WorkoutInput) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  // No longer user-editable (it used to pick the card icon, which is now
  // always the default) — preserved as-is on edit so existing data isn't lost.
  const category = initialValues?.category ?? null;
  const [exercises, setExercises] = useState<FormExercise[]>(
    () =>
      initialValues?.exercises.map((exercise) => ({
        ...exercise,
        id: exercise.id ?? generateId(),
      })) ?? [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  function updateExercise(id: string, patch: Partial<FormExercise>) {
    setExercises((current) =>
      current.map((exercise) => (exercise.id === id ? { ...exercise, ...patch } : exercise)),
    );
  }

  function removeExercise(id: string) {
    setExercises((current) => current.filter((exercise) => exercise.id !== id));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || exercises.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        exercises: exercises.map(({ id, ...rest }) => ({ ...rest, id })),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Nome do treino">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Treino A — Peito e Tríceps"
          required
        />
      </Field>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-slate-300">Exercícios</span>
          <Button type="button" variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
            + Adicionar exercício
          </Button>
        </div>

        {exercises.length === 0 ? (
          <EmptyState
            title="Nenhum exercício adicionado"
            description="Adicione ao menos um exercício para salvar o treino."
          />
        ) : (
          <Reorder.Group as="div" axis="y" values={exercises} onReorder={setExercises} className="space-y-2">
            {exercises.map((exercise, index) => {
              const prev = exercises[index - 1];
              const next = exercises[index + 1];
              return (
                <div key={exercise.id}>
                  <ExerciseRow
                    exercise={exercise}
                    index={index}
                    onChange={(patch) => updateExercise(exercise.id, patch)}
                    onRemove={() => removeExercise(exercise.id)}
                    connectedToPrev={Boolean(prev?.linkedToNext)}
                    connectedToNext={exercise.linkedToNext}
                  />
                  {next ? (
                    <div className="flex justify-center py-1">
                      <button
                        type="button"
                        onClick={() => updateExercise(exercise.id, { linkedToNext: !exercise.linkedToNext })}
                        className={
                          exercise.linkedToNext
                            ? "inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
                            : "inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
                        }
                      >
                        {exercise.linkedToNext ? (
                          <>
                            <Link2Off className="h-3.5 w-3.5" />
                            Desfazer superserie
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Unir com o próximo (superserie)
                          </>
                        )}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </Reorder.Group>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={submitting || !name.trim() || exercises.length === 0}>
          {submitting ? "Salvando..." : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(def) => setExercises((current) => [...current, exerciseFromDef(def)])}
      />
    </form>
  );
}

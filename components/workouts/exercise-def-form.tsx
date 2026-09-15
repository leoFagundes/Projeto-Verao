"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/types/workout";
import type { ExerciseDefInput } from "@/types/exercise";

export function ExerciseDefForm({
  initialValues,
  submitLabel = "Salvar exercício",
  onSubmit,
  onCancel,
}: {
  initialValues?: ExerciseDefInput;
  submitLabel?: string;
  onSubmit: (values: ExerciseDefInput) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | "">(initialValues?.muscleGroup ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initialValues?.imageUrl ?? null);
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        muscleGroup: muscleGroup || null,
        imageUrl,
        notes: notes.trim(),
      });
      if (!initialValues) {
        setName("");
        setMuscleGroup("");
        setImageUrl(null);
        setNotes("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          folder="exercises"
          label="Imagem (opcional)"
        />
        <Field label="Nome" className="flex-1">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Supino reto"
            required
          />
        </Field>
      </div>

      <Field label="Grupo muscular">
        <Select
          value={muscleGroup}
          onChange={(event) => setMuscleGroup(event.target.value as MuscleGroup | "")}
        >
          <option value="">Selecionar (opcional)</option>
          {MUSCLE_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Notas (opcional)">
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          placeholder="Ajustes do equipamento, técnica..."
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import { Modal } from "@/components/ui/modal";
import { createExerciseDef } from "@/lib/firebase/exercises";
import { useExercises } from "@/lib/hooks/use-exercises";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/types/workout";
import type { ExerciseDef } from "@/types/exercise";

export function ExercisePicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseDef) => void;
}) {
  const { exercises, loading } = useExercises();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | "">("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return exercises;
    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(term));
  }, [exercises, search]);

  function reset() {
    setSearch("");
    setCreating(false);
    setName("");
    setMuscleGroup("");
    setImageUrl(null);
    setNotes("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSelect(exercise: ExerciseDef) {
    onSelect(exercise);
    handleClose();
  }

  async function handleCreate() {
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      const id = await createExerciseDef({
        name: name.trim(),
        muscleGroup: muscleGroup || null,
        imageUrl,
        notes: notes.trim(),
      });
      toast.success("Exercício criado!");
      handleSelect({
        id,
        name: name.trim(),
        muscleGroup: muscleGroup || null,
        imageUrl,
        notes: notes.trim(),
        createdAt: Date.now(),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o exercício.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Adicionar exercício">
      {creating ? (
        <div className="space-y-4">
          <Field label="Nome">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Supino reto"
              autoFocus
              required
            />
          </Field>

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

          <ImageUpload
            label="Imagem do aparelho (opcional)"
            value={imageUrl}
            onChange={setImageUrl}
            folder="exercises"
          />

          <Field label="Notas (opcional)">
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Ajustes do equipamento, técnica..."
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCreate} disabled={!name.trim() || submitting}>
              {submitting ? "Criando..." : "Criar e adicionar"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              Voltar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar exercício..."
            autoFocus
          />

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Nenhum exercício encontrado.
              </p>
            ) : (
              filtered.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => handleSelect(exercise)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left transition hover:border-[var(--accent)]"
                >
                  {exercise.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={exercise.imageUrl}
                      alt={exercise.name}
                      className="h-11 w-11 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--surface)] text-lg">
                      🏋️
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{exercise.name}</p>
                    {exercise.muscleGroup ? (
                      <p className="text-xs text-slate-400">{exercise.muscleGroup}</p>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setName(search);
              setCreating(true);
            }}
          >
            + Criar novo exercício
          </Button>
        </div>
      )}
    </Modal>
  );
}

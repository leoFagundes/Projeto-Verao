"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { createExerciseDef } from "@/lib/firebase/exercises";
import { useExercises } from "@/lib/hooks/use-exercises";
import type { ExerciseDef, ExerciseDefInput } from "@/types/exercise";

import { ExerciseDefForm } from "./exercise-def-form";

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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return exercises;
    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(term));
  }, [exercises, search]);

  function handleClose() {
    setSearch("");
    setCreating(false);
    onClose();
  }

  function handleSelect(exercise: ExerciseDef) {
    onSelect(exercise);
    handleClose();
  }

  async function handleCreate(values: ExerciseDefInput) {
    try {
      const id = await createExerciseDef(values);
      toast.success("Exercício criado!");
      handleSelect({ id, ...values, createdAt: Date.now() });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o exercício.");
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Adicionar exercício">
      {creating ? (
        <ExerciseDefForm
          initialValues={{ name: search, muscleGroup: null, images: [], videoUrl: null, notes: "" }}
          submitLabel="Criar e adicionar"
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
        />
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
                  {exercise.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={exercise.images[0]}
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

          <Button type="button" variant="secondary" className="w-full" onClick={() => setCreating(true)}>
            + Criar novo exercício
          </Button>
        </div>
      )}
    </Modal>
  );
}

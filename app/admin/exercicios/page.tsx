"use client";

import { Dumbbell, Play, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminGate } from "@/components/layout/admin-gate";
import { AdminTabs } from "@/components/layout/admin-tabs";
import { AppHeader } from "@/components/layout/app-header";
import { ExerciseDefForm } from "@/components/workouts/exercise-def-form";
import { Card, SectionLabel } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Modal } from "@/components/ui/modal";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import { createExerciseDef, deleteExerciseDef, updateExerciseDef } from "@/lib/firebase/exercises";
import { useExercises } from "@/lib/hooks/use-exercises";
import { cn } from "@/lib/utils";
import type { ExerciseDef, ExerciseDefInput } from "@/types/exercise";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/types/workout";

function ExerciseLibraryContent() {
  const { exercises, loading } = useExercises();
  const [editing, setEditing] = useState<ExerciseDef | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ExerciseDef | null>(null);
  const [viewingImages, setViewingImages] = useState<ExerciseDef | null>(null);
  const [viewingVideoUrl, setViewingVideoUrl] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "todos">("todos");

  const usedMuscleGroups = useMemo(
    () => MUSCLE_GROUPS.filter((group) => exercises.some((exercise) => exercise.muscleGroup === group)),
    [exercises],
  );

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exercises.filter((exercise) => {
      const matchesSearch = query === "" || exercise.name.toLowerCase().includes(query);
      const matchesMuscle = muscleFilter === "todos" || exercise.muscleGroup === muscleFilter;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, search, muscleFilter]);

  async function handleCreate(values: ExerciseDefInput) {
    try {
      await createExerciseDef(values);
      toast.success("Exercício criado!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o exercício.");
    }
  }

  async function handleUpdate(values: ExerciseDefInput) {
    if (!editing) return;
    try {
      await updateExerciseDef(editing.id, values, editing.images);
      toast.success("Exercício atualizado!");
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  }

  return (
    <main className="min-h-dvh bg-[var(--bg)] text-white">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <AppHeader eyebrow="Admin" title="Projeto Verão" backHref="/" action={<AdminTabs />} />

        <p className="mt-4 text-sm text-slate-400">
          Exercícios cadastrados aqui ficam disponíveis para todos os perfis montarem seus treinos,
          sem precisar recriar do zero.
        </p>

        <section className="mt-6">
          <Card className="p-5 sm:p-6">
            <SectionLabel>Novo exercício</SectionLabel>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Adicionar à biblioteca</h2>
            <div className="mt-6">
              <ExerciseDefForm onSubmit={handleCreate} />
            </div>
          </Card>
        </section>

        <section className="mt-8">
          <SectionLabel>Exercícios cadastrados</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {loading ? "Carregando..." : `${exercises.length} exercício${exercises.length === 1 ? "" : "s"}`}
          </h2>

          {!loading && exercises.length > 0 ? (
            <div className="mt-4 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar exercício..."
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--field-bg)] py-2.5 pl-11 pr-4 text-sm text-white outline-none focus:border-[var(--accent)]"
                />
              </div>
              {usedMuscleGroups.length > 1 ? (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMuscleFilter("todos")}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition",
                      muscleFilter === "todos"
                        ? "text-slate-950"
                        : "border border-[var(--border)] text-slate-300 hover:text-white",
                    )}
                    style={
                      muscleFilter === "todos"
                        ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }
                        : undefined
                    }
                  >
                    Todos
                  </button>
                  {usedMuscleGroups.map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setMuscleFilter(group)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition",
                        muscleFilter === group
                          ? "text-slate-950"
                          : "border border-[var(--border)] text-slate-300 hover:text-white",
                      )}
                      style={
                        muscleFilter === group
                          ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }
                          : undefined
                      }
                    >
                      {group}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-3"
                >
                  <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-white/5" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3.5 w-2/3 animate-pulse rounded bg-white/5" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Nenhum exercício cadastrado ainda"
                description="Use o formulário acima para começar sua biblioteca."
              />
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Nenhum exercício encontrado"
                description="Tente outra busca ou limpe o filtro de grupo muscular."
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-3"
                >
                  {exercise.images.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setViewingImages(exercise)}
                      className="shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={exercise.images[0]}
                        alt={exercise.name}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    </button>
                  ) : (
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)] text-slate-500">
                      <Dumbbell className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{exercise.name}</p>
                    {exercise.muscleGroup ? (
                      <p className="text-xs text-slate-400">{exercise.muscleGroup}</p>
                    ) : null}
                    {exercise.videoUrl ? (
                      <button
                        type="button"
                        onClick={() => setViewingVideoUrl(exercise.videoUrl)}
                        className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                      >
                        <Play className="h-3 w-3" />
                        Ver vídeo
                      </button>
                    ) : null}
                    <div className="mt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(exercise)}
                        className="text-xs font-medium text-[var(--accent)] hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(exercise)}
                        className="text-xs font-medium text-red-300 hover:text-red-200"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Editar exercício">
        {editing ? (
          <ExerciseDefForm
            initialValues={{
              name: editing.name,
              muscleGroup: editing.muscleGroup,
              images: editing.images,
              videoUrl: editing.videoUrl,
              notes: editing.notes,
            }}
            submitLabel="Salvar alterações"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Modal>

      <ImageLightbox
        images={viewingImages?.images ?? []}
        open={viewingImages !== null}
        onClose={() => setViewingImages(null)}
      />

      <VideoLightbox
        url={viewingVideoUrl}
        open={viewingVideoUrl !== null}
        onClose={() => setViewingVideoUrl(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remover exercício"
        description={`Remover "${pendingDelete?.name}" da biblioteca? Treinos que já usam esse exercício continuam com o nome e os números que já tinham salvos, mas a imagem deixa de aparecer neles.`}
        confirmLabel="Remover"
        danger
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteExerciseDef(pendingDelete)
            .then(() => toast.success("Exercício removido."))
            .catch(() => toast.error("Não foi possível remover o exercício."));
        }}
      />
    </main>
  );
}

export default function ExerciseLibraryPage() {
  return (
    <AdminGate>
      <ExerciseLibraryContent />
    </AdminGate>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { AdminGate } from "@/components/layout/admin-gate";
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
import type { ExerciseDef, ExerciseDefInput } from "@/types/exercise";

function ExerciseLibraryContent() {
  const { exercises, loading } = useExercises();
  const [editing, setEditing] = useState<ExerciseDef | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ExerciseDef | null>(null);
  const [viewingImages, setViewingImages] = useState<ExerciseDef | null>(null);
  const [viewingVideoUrl, setViewingVideoUrl] = useState<string | null>(null);

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
        <AppHeader
          eyebrow="Admin"
          title="Biblioteca de exercícios"
          action={
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-white transition hover:border-[var(--accent)] sm:px-4"
            >
              Voltar
            </Link>
          }
        />

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

          {loading ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-[24px] bg-white/5" />
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Nenhum exercício cadastrado ainda"
                description="Use o formulário acima para começar sua biblioteca."
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {exercises.map((exercise) => (
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
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)] text-xl">
                      🏋️
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
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        ▶ Ver vídeo
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

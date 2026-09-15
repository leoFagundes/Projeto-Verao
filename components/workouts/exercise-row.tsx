"use client";

import { Reorder, useDragControls } from "framer-motion";
import { useState } from "react";

import { Field, Input, Textarea } from "@/components/ui/field";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import type { MuscleGroup } from "@/types/workout";

export type FormExercise = {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  restSeconds: number | null;
  muscleGroup: MuscleGroup | null;
  images: string[];
  videoUrl: string | null;
  notes: string;
  hidden: boolean;
};

export function ExerciseRow({
  exercise,
  onChange,
  onRemove,
}: {
  exercise: FormExercise;
  index: number;
  onChange: (patch: Partial<FormExercise>) => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();
  const [viewingImages, setViewingImages] = useState(false);
  const [viewingVideo, setViewingVideo] = useState(false);

  return (
    <Reorder.Item
      value={exercise}
      dragListener={false}
      dragControls={controls}
      className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-2)] p-4"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onPointerDown={(event) => controls.start(event)}
          className="mt-2 cursor-grab touch-none select-none text-slate-500 hover:text-slate-300 active:cursor-grabbing"
          aria-label="Reordenar"
        >
          ⠿
        </button>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {exercise.images.length > 0 ? (
                <button type="button" onClick={() => setViewingImages(true)} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={exercise.images[0]}
                    alt={exercise.name}
                    className="h-11 w-11 rounded-xl object-cover"
                  />
                </button>
              ) : (
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--surface)] text-lg">
                  🏋️
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{exercise.name}</p>
                {exercise.muscleGroup ? (
                  <p className="text-xs text-slate-400">{exercise.muscleGroup}</p>
                ) : null}
                {exercise.videoUrl ? (
                  <button
                    type="button"
                    onClick={() => setViewingVideo(true)}
                    className="text-xs text-[var(--accent)] hover:underline"
                  >
                    ▶ Ver vídeo
                  </button>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="shrink-0 text-xs font-medium text-red-300 hover:text-red-200"
            >
              Remover
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Séries">
              <Input
                type="number"
                min={1}
                value={exercise.sets}
                onChange={(event) => onChange({ sets: Number(event.target.value) || 1 })}
              />
            </Field>
            <Field label="Repetições">
              <Input
                value={exercise.reps}
                onChange={(event) => onChange({ reps: event.target.value })}
                placeholder="8-12"
              />
            </Field>
            <Field label="Carga (kg)">
              <Input
                type="number"
                min={0}
                step="0.5"
                value={exercise.weight ?? ""}
                onChange={(event) =>
                  onChange({ weight: event.target.value === "" ? null : Number(event.target.value) })
                }
                placeholder="Opcional"
              />
            </Field>
            <Field label="Descanso (s)">
              <Input
                type="number"
                min={0}
                value={exercise.restSeconds ?? ""}
                onChange={(event) =>
                  onChange({
                    restSeconds: event.target.value === "" ? null : Number(event.target.value),
                  })
                }
                placeholder="Opcional"
              />
            </Field>
          </div>

          <Field label="Notas do treino">
            <Textarea
              value={exercise.notes}
              onChange={(event) => onChange({ notes: event.target.value })}
              placeholder="Observações, técnica, ajustes..."
              rows={2}
            />
          </Field>
        </div>
      </div>

      <ImageLightbox
        images={exercise.images}
        open={viewingImages}
        onClose={() => setViewingImages(false)}
      />

      <VideoLightbox
        url={exercise.videoUrl}
        open={viewingVideo}
        onClose={() => setViewingVideo(false)}
      />
    </Reorder.Item>
  );
}

"use client";

import { Reorder, useDragControls } from "framer-motion";
import { useState } from "react";

import { Field, Input, Textarea } from "@/components/ui/field";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import { cn } from "@/lib/utils";
import type { MeasureType, MuscleGroup } from "@/types/workout";

export type FormExercise = {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  durationSeconds: number | null;
  measureType: MeasureType;
  trackWeight: boolean;
  weight: number | null;
  restSeconds: number | null;
  muscleGroup: MuscleGroup | null;
  images: string[];
  videoUrl: string | null;
  notes: string;
  hidden: boolean;
  linkedToNext: boolean;
};

export function ExerciseRow({
  exercise,
  onChange,
  onRemove,
  connectedToPrev,
  connectedToNext,
}: {
  exercise: FormExercise;
  index: number;
  onChange: (patch: Partial<FormExercise>) => void;
  onRemove: () => void;
  connectedToPrev?: boolean;
  connectedToNext?: boolean;
}) {
  const controls = useDragControls();
  const [viewingImages, setViewingImages] = useState(false);
  const [viewingVideo, setViewingVideo] = useState(false);

  return (
    <Reorder.Item
      as="div"
      value={exercise}
      dragListener={false}
      dragControls={controls}
      className={cn(
        "overflow-hidden border p-4 transition-opacity",
        connectedToPrev || connectedToNext
          ? "border-[var(--accent)]/40 bg-[var(--accent-soft)]"
          : "border-[var(--border)] bg-[var(--surface-2)]",
        connectedToPrev && connectedToNext
          ? "rounded-none"
          : connectedToNext
            ? "rounded-t-[22px] rounded-b-none"
            : connectedToPrev
              ? "rounded-b-[22px] rounded-t-none"
              : "rounded-[22px]",
        exercise.hidden ? "opacity-50" : "",
      )}
    >
      {connectedToPrev || connectedToNext ? (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          🔗 Superserie
        </p>
      ) : null}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onPointerDown={(event) => controls.start(event)}
          className="mt-2 cursor-grab touch-none select-none text-slate-500 hover:text-slate-300 active:cursor-grabbing"
          aria-label="Reordenar"
        >
          ⠿
        </button>

        <div className="min-w-0 flex-1 space-y-3">
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
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-white">{exercise.name}</p>
                  {exercise.hidden ? (
                    <span className="shrink-0 rounded-full border border-[var(--border-strong)] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400">
                      Oculto
                    </span>
                  ) : null}
                </div>
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

          <div className="flex gap-1.5 rounded-xl bg-[var(--field-bg)] p-1">
            <button
              type="button"
              onClick={() => onChange({ measureType: "reps" })}
              className={cn(
                "min-w-0 flex-1 truncate rounded-lg py-1.5 text-xs font-medium transition",
                exercise.measureType === "time" ? "text-slate-400 hover:text-slate-200" : "text-[var(--bg)]",
              )}
              style={exercise.measureType === "reps" ? { background: "var(--accent)" } : undefined}
            >
              Repetições
            </button>
            <button
              type="button"
              onClick={() => onChange({ measureType: "time" })}
              className={cn(
                "min-w-0 flex-1 truncate rounded-lg py-1.5 text-xs font-medium transition",
                exercise.measureType === "time" ? "text-[var(--bg)]" : "text-slate-400 hover:text-slate-200",
              )}
              style={exercise.measureType === "time" ? { background: "var(--accent)" } : undefined}
            >
              Tempo
            </button>
          </div>

          <div className={cn("grid grid-cols-2 gap-3", exercise.trackWeight ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
            <Field label="Séries">
              <Input
                type="number"
                min={1}
                value={exercise.sets}
                onChange={(event) => onChange({ sets: Number(event.target.value) || 1 })}
              />
            </Field>
            {exercise.measureType === "time" ? (
              <Field label="Duração alvo (s)">
                <Input
                  type="number"
                  min={0}
                  value={exercise.durationSeconds ?? ""}
                  onChange={(event) =>
                    onChange({
                      durationSeconds: event.target.value === "" ? null : Number(event.target.value),
                    })
                  }
                  placeholder="Ex.: 40"
                />
              </Field>
            ) : (
              <Field label="Repetições">
                <Input
                  value={exercise.reps}
                  onChange={(event) => onChange({ reps: event.target.value })}
                  placeholder="8-12"
                />
              </Field>
            )}
            {exercise.trackWeight ? (
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
            ) : null}
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

          <button
            type="button"
            onClick={() => onChange({ trackWeight: !exercise.trackWeight, weight: exercise.trackWeight ? null : exercise.weight })}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200"
          >
            <span
              role="switch"
              aria-checked={exercise.trackWeight}
              className="relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200"
              style={{ backgroundColor: exercise.trackWeight ? "var(--accent)" : "var(--field-bg)" }}
            >
              <span
                aria-hidden="true"
                className="inline-block h-3 w-3 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: exercise.trackWeight ? "translateX(13px)" : "translateX(2px)" }}
              />
            </span>
            Registrar carga neste exercício
          </button>

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

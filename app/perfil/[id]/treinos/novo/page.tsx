"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Card, SectionLabel } from "@/components/ui/card";
import { TemplatePickerModal } from "@/components/workouts/template-picker-modal";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { createWorkout } from "@/lib/firebase/workouts";
import { useProfiles } from "@/lib/hooks/use-profiles";
import { cn } from "@/lib/utils";
import type { WorkoutInput } from "@/types/workout";

export default function NewWorkoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profiles } = useProfiles();
  const [mode, setMode] = useState<"scratch" | "template">("scratch");
  const [templateOpen, setTemplateOpen] = useState(false);

  async function handleSubmit(values: WorkoutInput) {
    try {
      await createWorkout(params.id, values);
      toast.success("Treino criado!");
      router.push(`/perfil/${params.id}/treinos`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o treino.");
    }
  }

  return (
    <div>
      <SectionLabel>Novo treino</SectionLabel>
      <h2 className="mt-2 text-2xl font-semibold text-white">Monte seu treino</h2>

      <div className="mt-4 flex gap-1.5 rounded-2xl bg-[var(--field-bg)] p-1 sm:w-fit">
        <button
          type="button"
          onClick={() => setMode("scratch")}
          className={cn(
            "flex-1 rounded-xl px-4 py-2 text-sm font-medium transition sm:flex-none",
            mode === "scratch" ? "text-[var(--bg)]" : "text-slate-400 hover:text-slate-200",
          )}
          style={mode === "scratch" ? { background: "var(--accent)" } : undefined}
        >
          Criar do zero
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("template");
            setTemplateOpen(true);
          }}
          className={cn(
            "flex-1 rounded-xl px-4 py-2 text-sm font-medium transition sm:flex-none",
            mode === "template" ? "text-[var(--bg)]" : "text-slate-400 hover:text-slate-200",
          )}
          style={mode === "template" ? { background: "var(--accent)" } : undefined}
        >
          Usar modelo existente
        </button>
      </div>

      {mode === "scratch" ? (
        <Card className="mt-6 p-5 sm:p-6">
          <WorkoutForm onSubmit={handleSubmit} onCancel={() => router.back()} />
        </Card>
      ) : (
        <Card className="mt-6 p-8 text-center">
          <p className="text-sm text-slate-300">Escolha um treino de qualquer perfil para usar como ponto de partida.</p>
          <button
            type="button"
            onClick={() => setTemplateOpen(true)}
            className="mt-4 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-slate-950"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            Escolher modelo
          </button>
        </Card>
      )}

      <TemplatePickerModal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        currentProfileId={params.id}
        profiles={profiles}
        onCreated={(newWorkoutId) => router.push(`/perfil/${params.id}/treinos/${newWorkoutId}`)}
      />
    </div>
  );
}

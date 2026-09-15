"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, SectionLabel } from "@/components/ui/card";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { createWorkout } from "@/lib/firebase/workouts";
import type { WorkoutInput } from "@/types/workout";

export default function NewWorkoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

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

      <Card className="mt-6 p-5 sm:p-6">
        <WorkoutForm onSubmit={handleSubmit} onCancel={() => router.back()} />
      </Card>
    </div>
  );
}

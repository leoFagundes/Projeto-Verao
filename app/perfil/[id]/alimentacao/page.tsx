"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ActiveDietPanel } from "@/components/diet/active-diet-panel";
import { DietCard } from "@/components/diet/diet-card";
import { DietFormModal } from "@/components/diet/diet-form-modal";
import { DietHistoryList } from "@/components/diet/diet-history-list";
import { Button } from "@/components/ui/button";
import { Card, SectionLabel } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { activateDiet, deleteDiet } from "@/lib/firebase/diets";
import { useDietHistory } from "@/lib/hooks/use-diet-history";
import { useDiets } from "@/lib/hooks/use-diets";
import type { Diet } from "@/types/diet";

export default function DietPage() {
  const params = useParams<{ id: string }>();
  const { diets, loading } = useDiets(params.id);
  const { entries: historyEntries, loading: historyLoading } = useDietHistory(params.id);

  const [formOpen, setFormOpen] = useState(false);
  const [editingDiet, setEditingDiet] = useState<Diet | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Diet | null>(null);

  const activeDiet = diets.find((diet) => diet.active) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Alimentação</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Suas dietas</h2>
        </div>
        <Button onClick={() => setFormOpen(true)}>+ Criar dieta</Button>
      </div>

      {activeDiet ? <ActiveDietPanel profileId={params.id} diet={activeDiet} /> : null}

      <div>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-[24px] bg-white/5" />
            ))}
          </div>
        ) : diets.length === 0 ? (
          <EmptyState
            title="Nenhuma dieta criada ainda"
            description="Monte uma dieta com os horários e refeições de cada dia da semana."
            action={<Button onClick={() => setFormOpen(true)}>Criar dieta</Button>}
          />
        ) : (
          <>
            <SectionLabel>Suas dietas</SectionLabel>
            <div className="mt-3 space-y-2.5">
              {diets.map((diet, index) => (
                <DietCard
                  key={diet.id}
                  diet={diet}
                  index={index}
                  onActivate={() => activateDiet(params.id, diet.id, diets).catch(() => toast.error("Não foi possível ativar."))}
                  onEdit={() => setEditingDiet(diet)}
                  onDelete={() => setPendingDelete(diet)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {!historyLoading && historyEntries.length > 0 ? (
        <Card className="p-5">
          <SectionLabel>Histórico</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-white">Semanas realizadas</h3>
          <div className="mt-4">
            <DietHistoryList profileId={params.id} entries={historyEntries} />
          </div>
        </Card>
      ) : null}

      <DietFormModal open={formOpen} onClose={() => setFormOpen(false)} profileId={params.id} />
      <DietFormModal
        key={editingDiet?.id ?? "edit-diet"}
        open={editingDiet !== null}
        onClose={() => setEditingDiet(null)}
        profileId={params.id}
        diet={editingDiet}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remover dieta"
        description="Essa dieta será removida permanentemente. O histórico de semanas já salvas não é afetado."
        confirmLabel="Remover"
        danger
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteDiet(params.id, pendingDelete.id)
            .then(() => toast.success("Dieta removida."))
            .catch(() => toast.error("Não foi possível remover."));
        }}
      />
    </div>
  );
}

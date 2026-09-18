"use client";

import { motion } from "framer-motion";

import { totalMeals } from "@/lib/diet-stats";
import { WEEKDAYS, type Diet } from "@/types/diet";

export function DietCard({
  diet,
  index,
  onActivate,
  onEdit,
  onDelete,
}: {
  diet: Diet;
  index: number;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const daysWithMeals = diet.days.filter((day) => day.meals.length > 0).length;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
      className="flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-semibold text-white">{diet.name}</h3>
          {diet.active ? (
            <span className="rounded-full border border-[var(--accent)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">
              Ativa
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-slate-400">
          {totalMeals(diet.days)} refeições · {daysWithMeals}/{WEEKDAYS.length} dias planejados
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {!diet.active ? (
          <button type="button" onClick={onActivate} className="text-sm font-medium text-[var(--accent)] hover:underline">
            Ativar
          </button>
        ) : null}
        <button type="button" onClick={onEdit} className="text-sm text-slate-300 hover:text-white">
          Editar
        </button>
        <button type="button" onClick={onDelete} className="text-sm text-red-300 hover:text-red-200">
          Remover
        </button>
      </div>
    </motion.article>
  );
}

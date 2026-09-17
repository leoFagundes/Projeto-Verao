"use client";

import { motion } from "framer-motion";
import { PartyPopper } from "lucide-react";
import { toast } from "sonner";

import { deleteGoal } from "@/lib/firebase/goals";
import { goalProgress } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { MEASUREMENT_FIELDS, type BodyMeasurement, type MeasurementGoal } from "@/types/measurement";

export function GoalCard({
  goal,
  measurements,
  profileId,
}: {
  goal: MeasurementGoal;
  measurements: BodyMeasurement[];
  profileId: string;
}) {
  const fieldMeta = MEASUREMENT_FIELDS.find((f) => f.key === goal.field);
  const latestEntry = [...measurements].sort((a, b) => b.date - a.date).find((m) => m[goal.field] != null);
  const current = latestEntry ? (latestEntry[goal.field] as number) : null;
  const progress = goalProgress(goal, current);
  const achieved = progress != null && progress >= 100;

  async function handleDelete() {
    try {
      await deleteGoal(profileId, goal.field);
      toast.success("Meta removida.");
    } catch {
      toast.error("Não foi possível remover a meta.");
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">{fieldMeta?.label ?? goal.field}</p>
        <button type="button" onClick={handleDelete} className="text-xs text-slate-500 hover:text-red-300">
          Remover
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>
          {goal.startValue}
          {fieldMeta?.unit}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1",
            achieved ? "font-semibold text-[var(--accent)]" : "font-medium text-white",
          )}
        >
          {achieved ? (
            <>
              <PartyPopper className="h-3.5 w-3.5" />
              Meta atingida!
            </>
          ) : current != null ? (
            `${current}${fieldMeta?.unit}`
          ) : (
            "—"
          )}
        </span>
        <span>
          {goal.targetValue}
          {fieldMeta?.unit}
        </span>
      </div>

      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--field-bg)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress ?? 0}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }}
        />
      </div>
    </div>
  );
}

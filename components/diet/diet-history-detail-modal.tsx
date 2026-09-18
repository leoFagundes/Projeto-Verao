"use client";

import { AlertTriangle, Check } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { historySummary, progressKey } from "@/lib/diet-stats";
import { cn, formatDateLong } from "@/lib/utils";
import { WEEKDAYS, type DietHistoryEntry } from "@/types/diet";

export function DietHistoryDetailModal({
  entry,
  open,
  onClose,
}: {
  entry: DietHistoryEntry | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!entry) return null;
  const summary = historySummary(entry);

  return (
    <Modal open={open} onClose={onClose} title={entry.dietName}>
      <p className="text-sm text-slate-400">
        {formatDateLong(entry.cycleStartedAt)} até {formatDateLong(entry.endedAt)}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-[var(--surface-2)] px-2 py-2.5 text-center">
          <p className="text-base font-bold text-white">
            {summary.done}/{summary.total}
          </p>
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-500">Refeições</p>
        </div>
        <div className="rounded-xl bg-[var(--surface-2)] px-2 py-2.5 text-center">
          <p className="text-base font-bold text-white">{summary.adherence != null ? `${summary.adherence}%` : "—"}</p>
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-500">Aderência</p>
        </div>
        <div className="rounded-xl bg-[var(--surface-2)] px-2 py-2.5 text-center">
          <p className="text-base font-bold text-white">{summary.offTrackDays}</p>
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-500">Dias fora</p>
        </div>
      </div>

      <div className="mt-4 max-h-[45vh] space-y-3 overflow-y-auto pr-1">
        {WEEKDAYS.map((weekday) => {
          const dayPlan = entry.days.find((d) => d.day === weekday.key);
          const offTrack = entry.offTrack[weekday.key];
          if (!dayPlan || (dayPlan.meals.length === 0 && !offTrack?.off)) return null;

          return (
            <div key={weekday.key} className="border-t border-[var(--border)] pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{weekday.label}</p>
                {offTrack?.off ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    Fora da dieta
                  </span>
                ) : null}
              </div>
              {offTrack?.off && offTrack.note ? <p className="mt-1 text-xs text-slate-500">{offTrack.note}</p> : null}
              <div className="mt-2 space-y-1.5">
                {dayPlan.meals.map((meal) => {
                  const check = entry.progress[progressKey(weekday.key, meal.id)];
                  const chosen =
                    check?.done && check.optionIndex != null ? meal.options[check.optionIndex] : null;
                  return (
                    <div key={meal.id} className="flex items-start gap-2 text-sm">
                      <span
                        className={cn(
                          "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                          check?.done ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border-strong)]",
                        )}
                      >
                        {check?.done ? <Check className="h-2.5 w-2.5" style={{ color: "var(--bg)" }} /> : null}
                      </span>
                      <div className="min-w-0">
                        <p className={check?.done ? "text-slate-300" : "text-slate-500"}>
                          <span className="text-[var(--accent)]">{meal.time || "—"}</span>{" "}
                          {chosen ?? meal.options.join(" ou ")}
                        </p>
                        {check?.note ? <p className="text-xs text-slate-500">{check.note}</p> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

"use client";

import { AlertTriangle } from "lucide-react";

import { progressKey } from "@/lib/diet-stats";
import { cn } from "@/lib/utils";
import { WEEKDAYS, type Diet, type WeekdayKey } from "@/types/diet";

/** A compact "whole week at a glance" list — one row per day, one small
 * segment per meal, colored by done/pending — so you can spot gaps without
 * tapping through every day individually. */
export function WeekOverview({
  diet,
  selectedDay,
  onSelectDay,
}: {
  diet: Diet;
  selectedDay: WeekdayKey;
  onSelectDay: (day: WeekdayKey) => void;
}) {
  return (
    <div className="space-y-1">
      {WEEKDAYS.map((weekday) => {
        const dayPlan = diet.days.find((d) => d.day === weekday.key);
        const meals = dayPlan?.meals ?? [];
        const off = diet.offTrack[weekday.key]?.off;
        const selected = selectedDay === weekday.key;

        return (
          <button
            key={weekday.key}
            type="button"
            onClick={() => onSelectDay(weekday.key)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition",
              selected ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--surface)]",
            )}
          >
            <span
              className={cn(
                "w-8 shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em]",
                selected ? "text-[var(--accent)]" : "text-slate-400",
              )}
            >
              {weekday.short}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-1">
              {meals.length === 0 ? (
                <span className="text-[11px] text-slate-600">Sem refeições</span>
              ) : (
                meals.map((meal) => {
                  const done = diet.progress[progressKey(weekday.key, meal.id)]?.done;
                  return (
                    <span
                      key={meal.id}
                      className="h-1.5 flex-1 rounded-full"
                      style={{ background: done ? "var(--accent)" : "var(--field-bg)" }}
                    />
                  );
                })
              )}
            </div>
            {off ? <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" /> : null}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { formatDateLong } from "@/lib/utils";
import type { HeatmapDay } from "@/lib/stats";

const LEVEL_STYLE: Record<HeatmapDay["level"], string> = {
  0: "bg-[var(--surface)]",
  1: "bg-[rgba(var(--accent-rgb),0.3)]",
  2: "bg-[rgba(var(--accent-rgb),0.55)]",
  3: "bg-[rgba(var(--accent-rgb),0.8)]",
  4: "bg-[var(--accent)]",
};

const WEEKDAY_LABELS = ["Seg", "", "Qua", "", "Sex", "", ""];

export function ActivityHeatmap({ weeks }: { weeks: HeatmapDay[][] }) {
  return (
    <div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        <div className="flex shrink-0 flex-col gap-1 pt-[2px] text-[9px] text-slate-500">
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={index} className="grid h-3 place-items-center leading-none">
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${formatDateLong(day.date)} · ${day.count} atividade${day.count === 1 ? "" : "s"}`}
                  className={`h-3 w-3 rounded-[3px] ${LEVEL_STYLE[day.level]}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
        <span>Menos</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span key={level} className={`h-3 w-3 rounded-[3px] ${LEVEL_STYLE[level]}`} />
        ))}
        <span>Mais</span>
      </div>
    </div>
  );
}

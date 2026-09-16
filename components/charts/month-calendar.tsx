"use client";

import { cn } from "@/lib/utils";
import type { CalendarDay } from "@/lib/stats";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function MonthCalendar({
  days,
  monthLabel,
  todayTimestamp,
  selectedDate,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}: {
  days: CalendarDay[];
  monthLabel: string;
  todayTimestamp: number;
  selectedDate: number | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (day: CalendarDay) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          className="grid h-8 w-8 place-items-center rounded-full border border-[var(--border)] text-slate-300 transition hover:border-[var(--accent)] hover:text-white"
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <p className="text-sm font-semibold capitalize text-white">{monthLabel}</p>
        <button
          type="button"
          onClick={onNextMonth}
          className="grid h-8 w-8 place-items-center rounded-full border border-[var(--border)] text-slate-300 transition hover:border-[var(--accent)] hover:text-white"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-slate-500">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayNumber = new Date(day.date).getDate();
          const isToday = day.date === todayTimestamp;
          const isSelected = selectedDate === day.date;
          const hasActivity = day.sessionCount > 0 || day.runCount > 0;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDay(day)}
              disabled={!hasActivity}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-xs transition",
                day.inMonth ? "text-slate-300" : "text-slate-600",
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-transparent",
                hasActivity && !isSelected ? "hover:border-[var(--border-strong)]" : "",
                !hasActivity ? "cursor-default" : "",
                isToday ? "font-bold text-white" : "",
              )}
            >
              <span>{dayNumber}</span>
              <span className="flex h-1.5 gap-0.5">
                {day.sessionCount > 0 ? (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                ) : null}
                {day.runCount > 0 ? (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent-2)" }} />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

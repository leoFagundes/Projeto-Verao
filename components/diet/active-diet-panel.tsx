"use client";

import { AlertTriangle, CheckCheck, ChevronDown, ChevronUp, RotateCcw, StopCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Card, SectionLabel } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatTile } from "@/components/ui/stat-tile";
import { addMealOption, endDietCycle, setMealCheck, setOffTrack } from "@/lib/firebase/diets";
import { dietSummary, dueMealsSoFar, progressKey } from "@/lib/diet-stats";
import { cn, formatDateLong } from "@/lib/utils";
import { WEEKDAYS, todayWeekdayKey, type Diet, type DietMeal, type WeekdayKey } from "@/types/diet";

import { MealCheckRow } from "./meal-check-row";
import { WeekOverview } from "./week-overview";

const DAY_MS = 24 * 60 * 60 * 1000;

export function ActiveDietPanel({ profileId, diet }: { profileId: string; diet: Diet }) {
  const [selectedDay, setSelectedDay] = useState<WeekdayKey>(todayWeekdayKey());
  const [confirmAction, setConfirmAction] = useState<"restart" | "end" | null>(null);
  const [offTrackNote, setOffTrackNote] = useState(diet.offTrack[selectedDay]?.note ?? "");
  const [weekOverviewOpen, setWeekOverviewOpen] = useState(false);
  // "Now" can't be read during render (impure) — set once after mount, same
  // as the current-date reads elsewhere in the app.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  const dayPlan = diet.days.find((d) => d.day === selectedDay) ?? diet.days[0];
  const summary = dietSummary(diet);
  const due = dueMealsSoFar(diet, now != null ? new Date(now) : undefined);
  const offTrack = diet.offTrack[selectedDay];
  const allDoneToday =
    dayPlan.meals.length > 0 && dayPlan.meals.every((meal) => diet.progress[progressKey(selectedDay, meal.id)]?.done);
  const cycleDay =
    diet.cycleStartedAt && now != null ? Math.min(7, Math.floor((now - diet.cycleStartedAt) / DAY_MS) + 1) : null;

  function selectDay(day: WeekdayKey) {
    setSelectedDay(day);
    setOffTrackNote(diet.offTrack[day]?.note ?? "");
  }

  async function handleEndCycle(keepActive: boolean) {
    try {
      await endDietCycle(profileId, diet, keepActive);
      toast.success(keepActive ? "Semana reiniciada! O histórico da anterior foi salvo." : "Dieta encerrada. A semana foi salva no histórico.");
    } catch {
      toast.error("Não foi possível concluir a ação.");
    }
  }

  async function handleAddOption(meal: DietMeal, option: string) {
    try {
      const newIndex = meal.options.length;
      await addMealOption(profileId, diet.id, diet.days, selectedDay, meal.id, option);
      const key = progressKey(selectedDay, meal.id);
      const existing = diet.progress[key];
      await setMealCheck(profileId, diet.id, key, { done: true, note: existing?.note ?? "", optionIndex: newIndex });
      toast.success("Opção adicionada!");
    } catch {
      toast.error("Não foi possível adicionar a opção.");
    }
  }

  async function completeAllForDay() {
    try {
      await Promise.all(
        dayPlan.meals.map((meal) => {
          const key = progressKey(selectedDay, meal.id);
          const existing = diet.progress[key];
          return setMealCheck(profileId, diet.id, key, {
            done: true,
            note: existing?.note ?? "",
            optionIndex: meal.options.length > 1 ? (existing?.optionIndex ?? 0) : null,
          });
        }),
      );
    } catch {
      toast.error("Não foi possível marcar tudo.");
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionLabel>Dieta ativa</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-white">{diet.name}</h3>
          {diet.cycleStartedAt ? (
            <p className="text-xs text-slate-400">
              Semana iniciada em {formatDateLong(diet.cycleStartedAt)}
              {cycleDay ? ` · dia ${cycleDay} de 7` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmAction("restart")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-[var(--accent)] hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reiniciar semana
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction("end")}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/20"
          >
            <StopCircle className="h-3.5 w-3.5" />
            Encerrar dieta
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        <StatTile label="Refeições" value={`${summary.done}/${summary.total}`} />
        <StatTile
          label="Hoje"
          value={due.total > 0 ? `${due.done}/${due.total}` : "—"}
          hint={summary.adherence != null ? `${summary.adherence}% na semana` : undefined}
        />
        <StatTile label="Dias fora" value={summary.offTrackDays} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((weekday) => {
            const plan = diet.days.find((d) => d.day === weekday.key);
            const off = diet.offTrack[weekday.key]?.off;
            const hasDone = plan?.meals.some((meal) => diet.progress[progressKey(weekday.key, meal.id)]?.done);
            const selected = selectedDay === weekday.key;
            return (
              <button
                key={weekday.key}
                type="button"
                onClick={() => selectDay(weekday.key)}
                className={cn(
                  "relative rounded-full px-3 py-1.5 text-xs font-medium transition",
                  selected ? "text-slate-950" : "border border-[var(--border)] text-slate-300 hover:text-white",
                )}
                style={selected ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" } : undefined}
              >
                {weekday.short}
                {!selected && off ? (
                  <AlertTriangle className="absolute -right-1 -top-1 h-3 w-3 text-amber-400" />
                ) : !selected && hasDone ? (
                  <span
                    className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setWeekOverviewOpen((current) => !current)}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-400 hover:text-white"
        >
          Ver semana
          {weekOverviewOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {weekOverviewOpen ? (
        <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2">
          <WeekOverview diet={diet} selectedDay={selectedDay} onSelectDay={selectDay} />
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
          {WEEKDAYS.find((w) => w.key === selectedDay)?.label}
        </p>
        {dayPlan.meals.length > 0 && !allDoneToday ? (
          <button
            type="button"
            onClick={completeAllForDay}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar tudo como feito
          </button>
        ) : null}
      </div>

      <div className="mt-2 space-y-2">
        {dayPlan.meals.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            Nenhuma refeição planejada para {WEEKDAYS.find((w) => w.key === selectedDay)?.label}.
          </p>
        ) : (
          dayPlan.meals.map((meal) => (
            <MealCheckRow
              key={meal.id}
              meal={meal}
              check={diet.progress[progressKey(selectedDay, meal.id)]}
              onChange={(patch) => setMealCheck(profileId, diet.id, progressKey(selectedDay, meal.id), patch)}
              onAddOption={(option) => handleAddOption(meal, option)}
            />
          ))
        )}
      </div>

      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
        <button
          type="button"
          onClick={() => setOffTrack(profileId, diet.id, selectedDay, { off: !offTrack?.off, note: offTrackNote })}
          aria-pressed={Boolean(offTrack?.off)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm text-slate-200">
            <AlertTriangle className="h-4 w-4" style={{ color: offTrack?.off ? "var(--accent)" : undefined }} />
            Fugi da dieta nesse dia
          </span>
          <span
            role="switch"
            aria-checked={Boolean(offTrack?.off)}
            className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200"
            style={{ backgroundColor: offTrack?.off ? "var(--accent)" : "var(--field-bg)" }}
          >
            <span
              aria-hidden="true"
              className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: offTrack?.off ? "translateX(22px)" : "translateX(2px)" }}
            />
          </span>
        </button>
        {offTrack?.off ? (
          <input
            value={offTrackNote}
            onChange={(event) => setOffTrackNote(event.target.value)}
            onBlur={() => {
              if (offTrackNote !== (offTrack?.note ?? "")) {
                setOffTrack(profileId, diet.id, selectedDay, { off: true, note: offTrackNote });
              }
            }}
            placeholder="O que rolou? (opcional)"
            className="mt-2.5 w-full rounded-lg border border-[var(--border)] bg-[var(--field-bg)] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-[var(--accent)]"
          />
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmAction === "restart"}
        title="Reiniciar semana"
        description="A semana atual será salva no histórico e o checklist começa do zero, com a mesma dieta continuando ativa."
        confirmLabel="Reiniciar"
        onClose={() => setConfirmAction(null)}
        onConfirm={() => handleEndCycle(true)}
      />
      <ConfirmDialog
        open={confirmAction === "end"}
        title="Encerrar dieta"
        description="A semana atual será salva no histórico e nenhuma dieta ficará ativa até você ativar uma novamente."
        confirmLabel="Encerrar"
        danger
        onClose={() => setConfirmAction(null)}
        onConfirm={() => handleEndCycle(false)}
      />
    </Card>
  );
}

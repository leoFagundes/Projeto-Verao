"use client";

import { Copy, Plus, Trash2, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { createDiet, updateDiet } from "@/lib/firebase/diets";
import { useProfiles } from "@/lib/hooks/use-profiles";
import { cn, generateId } from "@/lib/utils";
import { WEEKDAYS, type Diet, type DietDayPlan, type DietMeal, type WeekdayKey } from "@/types/diet";

function emptyDays(): DietDayPlan[] {
  return WEEKDAYS.map((weekday) => ({ day: weekday.key, meals: [] }));
}

/** Drops empty alternative options (and whole meals left with none) before saving. */
function sanitizeDays(rawDays: DietDayPlan[]): DietDayPlan[] {
  return rawDays.map((day) => ({
    ...day,
    meals: day.meals
      .map((meal) => ({ ...meal, options: meal.options.map((option) => option.trim()).filter(Boolean) }))
      .filter((meal) => meal.options.length > 0),
  }));
}

const WEEKDAY_KEYS: WeekdayKey[] = ["seg", "ter", "qua", "qui", "sex"];

export function DietFormModal({
  open,
  onClose,
  profileId,
  diet,
}: {
  open: boolean;
  onClose: () => void;
  profileId: string;
  diet?: Diet | null;
}) {
  const isEdit = Boolean(diet);
  const [name, setName] = useState(diet?.name ?? "");
  const [days, setDays] = useState<DietDayPlan[]>(diet?.days ?? emptyDays());
  const [activeDay, setActiveDay] = useState<WeekdayKey>("seg");
  const [submitting, setSubmitting] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyTargets, setCopyTargets] = useState<WeekdayKey[]>([]);
  const { profiles } = useProfiles();
  const shareableProfiles = profiles.filter(
    (profile) => profile.id !== profileId && profile.allowSharedWorkouts,
  );
  const [shareWithProfileIds, setShareWithProfileIds] = useState<string[]>([]);

  const dayPlan = days.find((d) => d.day === activeDay) ?? days[0];
  const otherWeekdays = WEEKDAYS.filter((weekday) => weekday.key !== activeDay);

  function toggleShareProfile(targetProfileId: string) {
    setShareWithProfileIds((current) =>
      current.includes(targetProfileId)
        ? current.filter((id) => id !== targetProfileId)
        : [...current, targetProfileId],
    );
  }

  function addMeal() {
    setDays((current) =>
      current.map((day) =>
        day.day === activeDay
          ? { ...day, meals: [...day.meals, { id: generateId(), time: "", options: [""] }] }
          : day,
      ),
    );
  }

  function updateMealBy(mealId: string, updater: (meal: DietMeal) => DietMeal) {
    setDays((current) =>
      current.map((day) =>
        day.day === activeDay
          ? { ...day, meals: day.meals.map((meal) => (meal.id === mealId ? updater(meal) : meal)) }
          : day,
      ),
    );
  }

  function updateMealTime(mealId: string, time: string) {
    updateMealBy(mealId, (meal) => ({ ...meal, time }));
  }

  function updateMealOption(mealId: string, index: number, value: string) {
    updateMealBy(mealId, (meal) => ({
      ...meal,
      options: meal.options.map((option, i) => (i === index ? value : option)),
    }));
  }

  function addMealOption(mealId: string) {
    updateMealBy(mealId, (meal) => ({ ...meal, options: [...meal.options, ""] }));
  }

  function removeMealOption(mealId: string, index: number) {
    updateMealBy(mealId, (meal) => ({ ...meal, options: meal.options.filter((_, i) => i !== index) }));
  }

  function removeMeal(mealId: string) {
    setDays((current) =>
      current.map((day) =>
        day.day === activeDay ? { ...day, meals: day.meals.filter((meal) => meal.id !== mealId) } : day,
      ),
    );
  }

  function toggleCopyTarget(day: WeekdayKey) {
    setCopyTargets((current) =>
      current.includes(day) ? current.filter((key) => key !== day) : [...current, day],
    );
  }

  function applyCopy() {
    if (copyTargets.length === 0) return;
    // Fresh ids per copy, even though the underlying key (`${day}:${mealId}`)
    // is already unique across days — keeps every meal instance independent
    // if one copy is edited later.
    setDays((current) =>
      current.map((day) =>
        copyTargets.includes(day.day)
          ? { ...day, meals: dayPlan.meals.map((meal) => ({ ...meal, id: generateId(), options: [...meal.options] })) }
          : day,
      ),
    );
    toast.success(
      `Refeições copiadas para ${copyTargets.length} dia${copyTargets.length === 1 ? "" : "s"}.`,
    );
    setCopyTargets([]);
    setCopyOpen(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      const input = { name: name.trim(), days: sanitizeDays(days) };
      if (isEdit && diet) {
        await updateDiet(profileId, diet.id, input);
        toast.success("Dieta atualizada!");
      } else {
        await createDiet(profileId, input);
        toast.success("Dieta criada!");

        if (shareWithProfileIds.length > 0) {
          const myName = profiles.find((profile) => profile.id === profileId)?.name ?? "Alguém";
          const sharedNames: string[] = [];
          for (const targetProfileId of shareWithProfileIds) {
            try {
              await createDiet(targetProfileId, { ...input, sharedByName: myName });
              sharedNames.push(profiles.find((profile) => profile.id === targetProfileId)?.name ?? "outro perfil");
            } catch {
              // Best-effort — one failed share shouldn't block the others or the main save.
            }
          }
          if (sharedNames.length > 0) {
            toast.success(`Dieta também criada para ${sharedNames.join(", ")}.`);
          }
        }
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Editar dieta" : "Criar dieta"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome da dieta">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Corte, Definição, Manutenção..."
            required
          />
        </Field>

        <div>
          <span className="mb-2 block text-sm text-slate-300">Dia da semana</span>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((weekday) => {
              const count = days.find((d) => d.day === weekday.key)?.meals.length ?? 0;
              const selected = activeDay === weekday.key;
              return (
                <button
                  key={weekday.key}
                  type="button"
                  onClick={() => {
                    setActiveDay(weekday.key);
                    setCopyOpen(false);
                    setCopyTargets([]);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                    selected ? "text-slate-950" : "border border-[var(--border)] text-slate-300 hover:text-white",
                  )}
                  style={selected ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" } : undefined}
                >
                  {weekday.short}
                  {count > 0 ? ` · ${count}` : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          {dayPlan.meals.length === 0 ? (
            <p className="py-2 text-center text-sm text-slate-500">
              Nenhuma refeição em {WEEKDAYS.find((w) => w.key === activeDay)?.label} ainda.
            </p>
          ) : (
            dayPlan.meals.map((meal) => (
              <div key={meal.id} className="space-y-1.5 rounded-xl bg-[var(--field-bg)]/40 p-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={meal.time}
                    onChange={(event) => updateMealTime(meal.id, event.target.value)}
                    className="w-[7.5rem] min-w-0 shrink px-2.5 py-2 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeMeal(meal.id)}
                    className="ml-auto shrink-0 text-slate-500 hover:text-red-300"
                    aria-label="Remover refeição"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {meal.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(event) => updateMealOption(meal.id, index, event.target.value)}
                        placeholder={index === 0 ? "Ex.: Frango com arroz e salada" : "Opção alternativa (ex.: Shake)"}
                        className="w-full px-3 py-2 text-sm"
                        required={index === 0}
                      />
                      {meal.options.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeMealOption(meal.id, index)}
                          className="shrink-0 text-slate-500 hover:text-red-300"
                          aria-label="Remover opção"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addMealOption(meal.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white"
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar opção alternativa
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <button
              type="button"
              onClick={addMeal}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar refeição em {WEEKDAYS.find((w) => w.key === activeDay)?.short}
            </button>
            {dayPlan.meals.length > 0 ? (
              <button
                type="button"
                onClick={() => setCopyOpen((current) => !current)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white"
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar para outros dias
              </button>
            ) : null}
          </div>

          {copyOpen ? (
            <div className="space-y-2.5 rounded-xl border border-[var(--border)] bg-[var(--field-bg)] p-3">
              <p className="text-xs text-slate-400">
                Copiar as {dayPlan.meals.length} refeições de {WEEKDAYS.find((w) => w.key === activeDay)?.label} para:
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCopyTargets(WEEKDAY_KEYS.filter((key) => key !== activeDay))}
                  className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-[var(--accent)] hover:text-white"
                >
                  Dias úteis
                </button>
                <button
                  type="button"
                  onClick={() => setCopyTargets(otherWeekdays.map((w) => w.key))}
                  className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-[var(--accent)] hover:text-white"
                >
                  Todos os dias
                </button>
                {copyTargets.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCopyTargets([])}
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-white"
                  >
                    Limpar
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {otherWeekdays.map((weekday) => {
                  const selected = copyTargets.includes(weekday.key);
                  return (
                    <button
                      key={weekday.key}
                      type="button"
                      onClick={() => toggleCopyTarget(weekday.key)}
                      aria-pressed={selected}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition",
                        selected
                          ? "border-[var(--accent)] text-[var(--bg)]"
                          : "border border-[var(--border)] text-slate-300 hover:border-[var(--accent)]",
                      )}
                      style={selected ? { background: "var(--accent)" } : undefined}
                    >
                      {weekday.short}
                    </button>
                  );
                })}
              </div>
              {copyTargets.some((key) => (days.find((d) => d.day === key)?.meals.length ?? 0) > 0) ? (
                <p className="text-[11px] text-amber-400">
                  Isso substitui as refeições já existentes nos dias marcados.
                </p>
              ) : null}
              <Button type="button" size="sm" onClick={applyCopy} disabled={copyTargets.length === 0}>
                Copiar para {copyTargets.length || ""} dia{copyTargets.length === 1 ? "" : "s"}
              </Button>
            </div>
          ) : null}
        </div>

        {!isEdit && shareableProfiles.length > 0 ? (
          <div>
            <span className="mb-2 block text-sm text-slate-300">Compartilhar esta dieta com (opcional)</span>
            <div className="flex flex-wrap gap-2">
              {shareableProfiles.map((profile) => {
                const selected = shareWithProfileIds.includes(profile.id);
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => toggleShareProfile(profile.id)}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      selected
                        ? "border-[var(--accent)] text-[var(--bg)]"
                        : "border-[var(--border)] text-slate-300 hover:border-[var(--accent)]",
                    )}
                    style={selected ? { background: "var(--accent)" } : undefined}
                  >
                    {profile.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Cria uma cópia independente dessa dieta pros perfis marcados.
            </p>
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting || !name.trim()}>
          {submitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar dieta"}
        </Button>
      </form>
    </Modal>
  );
}

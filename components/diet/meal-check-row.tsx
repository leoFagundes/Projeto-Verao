"use client";

import { Check, Plus, X } from "lucide-react";
import { type FormEvent, useState } from "react";

import { cn } from "@/lib/utils";
import type { DietMeal, DietMealCheck } from "@/types/diet";

/** Owns its own note draft so typing doesn't fight live Firestore updates —
 * committed on blur, same pattern used for other lightly-debounced text
 * fields in the app.
 *
 * A meal with a single option behaves like before: one checkbox toggles it
 * done. A meal with alternative options (e.g. "Shake" or "Pão com ovo")
 * drops the separate checkbox — each option is its own chip, and tapping
 * one both marks the meal done *and* records which variant was actually
 * eaten; tapping the already-chosen one again undoes it.
 *
 * The "+" adds a one-off choice that wasn't planned (e.g. neither "Shake"
 * nor "Pão com ovo" today) — it's saved onto the diet itself via
 * `onAddOption` and immediately selected as what was eaten. */
export function MealCheckRow({
  meal,
  check,
  onChange,
  onAddOption,
}: {
  meal: DietMeal;
  check: DietMealCheck | undefined;
  onChange: (patch: DietMealCheck) => void;
  onAddOption: (option: string) => void;
}) {
  const done = check?.done ?? false;
  const [note, setNote] = useState(check?.note ?? "");
  const [addingOption, setAddingOption] = useState(false);
  const [optionDraft, setOptionDraft] = useState("");
  const hasVariants = meal.options.length > 1;

  function toggleSingle() {
    onChange({ done: !done, note, optionIndex: null });
  }

  function chooseOption(index: number) {
    const alreadyChosen = done && check?.optionIndex === index;
    onChange({ done: !alreadyChosen, note, optionIndex: alreadyChosen ? null : index });
  }

  function commitNote() {
    if (note !== (check?.note ?? "")) onChange({ done, note, optionIndex: check?.optionIndex ?? null });
  }

  function submitOption(event: FormEvent) {
    event.preventDefault();
    const trimmed = optionDraft.trim();
    if (!trimmed) return;
    onAddOption(trimmed);
    setOptionDraft("");
    setAddingOption(false);
  }

  const addOptionButton = (
    <button
      type="button"
      onClick={() => setAddingOption(true)}
      className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-dashed border-[var(--border-strong)] text-slate-400 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      aria-label="Adicionar outra opção para esta refeição"
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div className="flex items-start gap-3 rounded-xl bg-[var(--surface-2)] p-3">
      {hasVariants ? (
        <span
          aria-hidden="true"
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2"
          style={
            done
              ? { borderColor: "var(--accent)", backgroundColor: "var(--accent)", color: "var(--bg)" }
              : { borderColor: "var(--border-strong)", color: "transparent" }
          }
        >
          <Check className="h-3.5 w-3.5" />
        </span>
      ) : (
        <button
          type="button"
          onClick={toggleSingle}
          aria-pressed={done}
          aria-label={done ? "Marcar como não feita" : "Marcar como feita"}
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition"
          style={
            done
              ? { borderColor: "var(--accent)", backgroundColor: "var(--accent)", color: "var(--bg)" }
              : { borderColor: "var(--border-strong)", color: "transparent" }
          }
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-xs font-semibold text-[var(--accent)]">{meal.time || "—"}</span>
          {hasVariants ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {meal.options.map((option, index) => {
                const selected = done && check?.optionIndex === index;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => chooseOption(index)}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                      selected
                        ? "border-[var(--accent)] text-[var(--bg)]"
                        : "border-[var(--border-strong)] text-slate-300 hover:border-[var(--accent)]",
                    )}
                    style={selected ? { background: "var(--accent)" } : undefined}
                  >
                    {option}
                  </button>
                );
              })}
              {addOptionButton}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <p className={done ? "text-sm text-slate-400 line-through decoration-slate-600" : "text-sm text-white"}>
                {meal.options[0]}
              </p>
              {addOptionButton}
            </div>
          )}
        </div>

        {addingOption ? (
          <form onSubmit={submitOption} className="mt-1.5 flex items-center gap-1.5">
            <input
              value={optionDraft}
              onChange={(event) => setOptionDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setAddingOption(false);
                  setOptionDraft("");
                }
              }}
              autoFocus
              placeholder="Ex.: Omelete de claras"
              className="w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--field-bg)] px-2 py-1 text-xs text-white outline-none focus:border-[var(--accent)]"
            />
            <button type="submit" className="shrink-0 text-[var(--accent)]" aria-label="Confirmar nova opção">
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingOption(false);
                setOptionDraft("");
              }}
              className="shrink-0 text-slate-500"
              aria-label="Cancelar"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        ) : null}

        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={commitNote}
          placeholder="Nota (opcional)"
          className="mt-1.5 w-full rounded-lg border-none bg-transparent text-xs text-slate-400 outline-none placeholder:text-slate-600"
        />
      </div>
    </div>
  );
}

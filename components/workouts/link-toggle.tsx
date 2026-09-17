"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

const SEEN_KEY = "projeto-verao-link-toggle-seen";

/** The "manter vinculado" toggle used when copying a workout or picking a
 * template — shows a one-time example the first time anyone sees it, since
 * "linked" is a non-obvious concept for a first-timer. */
export function LinkToggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    // Reading a first-run flag from localStorage — SSR has none, so this can
    // only happen in an effect, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowExample(localStorage.getItem(SEEN_KEY) !== "true");
  }, []);

  function dismissExample() {
    setShowExample(false);
    try {
      localStorage.setItem(SEEN_KEY, "true");
    } catch {
      // Best-effort — worst case the example shows again next time.
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block text-sm text-slate-300">Manter vinculado</span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Editar um deles pode aplicar a alteração aos outros também.
          </span>
        </span>
        <span
          role="switch"
          aria-checked={checked}
          className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200"
          style={{ backgroundColor: checked ? "var(--accent)" : "var(--field-bg)" }}
        >
          <span
            aria-hidden="true"
            className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
            style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
          />
        </span>
      </button>

      {showExample ? (
        <div className="mt-2 flex items-start justify-between gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-2.5 text-xs text-slate-300">
          <p>
            Exemplo: se você e outro perfil ficam vinculados nesse treino, adicionar ou remover um exercício
            aparece pros dois — mas cada um mantém sua própria carga, repetições e notas.
          </p>
          <button
            type="button"
            onClick={dismissExample}
            className="shrink-0 text-slate-400 hover:text-white"
            aria-label="Entendi, não mostrar de novo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

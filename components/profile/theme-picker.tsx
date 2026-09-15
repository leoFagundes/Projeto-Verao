"use client";

import { THEME_META, THEMES } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Theme } from "@/types/profile";

export function ThemePicker({
  value,
  onChange,
}: {
  value: Theme;
  onChange: (theme: Theme) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {THEMES.map((theme) => {
        const meta = THEME_META[theme];
        const active = value === theme;

        return (
          <button
            key={theme}
            type="button"
            onClick={() => onChange(theme)}
            className={cn(
              "rounded-[22px] border p-3 text-left transition",
              active
                ? "border-[var(--accent)] bg-[var(--surface-2)]"
                : "border-[var(--border)] bg-[var(--field-bg)] hover:border-[var(--border-strong)]",
            )}
          >
            <div className="h-16 rounded-2xl" style={{ background: meta.swatch }} />
            <p className="mt-2 text-sm font-medium text-white">{meta.label}</p>
          </button>
        );
      })}
    </div>
  );
}

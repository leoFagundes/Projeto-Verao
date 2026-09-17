"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import type { ProfileInput, Theme } from "@/types/profile";

import { ThemePicker } from "./theme-picker";

export function ProfileForm({
  initialValues,
  submitLabel = "Salvar perfil",
  onSubmit,
  onCancel,
}: {
  initialValues?: ProfileInput;
  submitLabel?: string;
  onSubmit: (values: ProfileInput) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialValues?.photoUrl ?? null);
  const [theme, setTheme] = useState<Theme>(initialValues?.theme ?? "padrao");
  const [password, setPassword] = useState(initialValues?.password ?? "");
  const [allowSharedWorkouts, setAllowSharedWorkouts] = useState(initialValues?.allowSharedWorkouts ?? false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        photoUrl,
        theme,
        password: password.trim() || null,
        allowSharedWorkouts,
      });
      if (!initialValues) {
        setName("");
        setPhotoUrl(null);
        setTheme("padrao");
        setPassword("");
        setAllowSharedWorkouts(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <ImageUpload
          value={photoUrl}
          onChange={setPhotoUrl}
          folder="profiles"
          label="Foto (opcional)"
          shape="circle"
          previewName={name}
        />
        <Field label="Nome" className="flex-1">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: João"
            required
          />
        </Field>
      </div>

      <div>
        <span className="mb-2 block text-sm text-slate-300">Tema visual</span>
        <ThemePicker value={theme} onChange={setTheme} />
      </div>

      <Field label="Senha (opcional)">
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Deixe em branco para entrar sem senha"
        />
      </Field>

      <button
        type="button"
        onClick={() => setAllowSharedWorkouts((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block text-sm text-slate-300">Receber treinos compartilhados</span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Permite que outro perfil adicione um treino a este perfil enquanto o realiza.
          </span>
        </span>
        <span
          role="switch"
          aria-checked={allowSharedWorkouts}
          className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200"
          style={{ backgroundColor: allowSharedWorkouts ? "var(--accent)" : "var(--field-bg)" }}
        >
          <span
            aria-hidden="true"
            className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
            style={{ transform: allowSharedWorkouts ? "translateX(22px)" : "translateX(2px)" }}
          />
        </span>
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}

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
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), photoUrl, theme });
      if (!initialValues) {
        setName("");
        setPhotoUrl(null);
        setTheme("padrao");
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

"use client";

import { type FormEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { uploadImage } from "@/lib/firebase/storage";

export function MultiImageUpload({
  values,
  onChange,
  folder,
  label,
}: {
  values: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange([...values, url]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  function handleUseLink(event: FormEvent) {
    event.preventDefault();
    const trimmed = linkValue.trim();
    if (!trimmed) return;
    onChange([...values, trimmed]);
    setLinkValue("");
    setLinkMode(false);
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div>
      {label ? <span className="mb-2 block text-sm text-slate-300">{label}</span> : null}

      <div className="flex flex-wrap gap-3">
        {values.map((url, index) => (
          <div key={`${url}-${index}`} className="relative h-20 w-20 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Imagem ${index + 1}`}
              className="h-full w-full rounded-2xl border border-[var(--border)] object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs text-slate-300 hover:text-white"
              aria-label="Remover imagem"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--field-bg)] text-slate-400 transition hover:border-[var(--accent)]"
        >
          {uploading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <span className="text-2xl">+</span>
          )}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Enviar do computador
        </button>
        <button
          type="button"
          onClick={() => setLinkMode((current) => !current)}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          {linkMode ? "Cancelar link" : "Ou colar um link"}
        </button>
      </div>

      {linkMode ? (
        <div className="mt-3 flex gap-2">
          <input
            type="url"
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleUseLink(event);
            }}
            placeholder="https://exemplo.com/imagem.jpg"
            autoFocus
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--field-bg)] px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)]"
          />
          <button
            type="button"
            onClick={handleUseLink}
            disabled={!linkValue.trim()}
            className="shrink-0 rounded-2xl border border-[var(--border)] px-4 text-sm font-medium text-white transition hover:border-[var(--accent)] disabled:opacity-50"
          >
            Usar
          </button>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

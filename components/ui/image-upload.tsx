"use client";

import { type FormEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { uploadImage } from "@/lib/firebase/storage";
import { cn } from "@/lib/utils";

export function ImageUpload({
  value,
  onChange,
  folder,
  label,
  shape = "square",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
  shape?: "square" | "circle";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value);
  const [uploading, setUploading] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  async function handleFile(file: File) {
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar imagem.");
      setPreview(value);
    } finally {
      setUploading(false);
    }
  }

  function handleUseLink(event: FormEvent) {
    event.preventDefault();
    const trimmed = linkValue.trim();
    if (!trimmed) return;
    setPreview(trimmed);
    onChange(trimmed);
    setLinkMode(false);
    setLinkValue("");
  }

  return (
    <div>
      {label ? <span className="mb-2 block text-sm text-slate-300">{label}</span> : null}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden border border-[var(--border)] bg-[var(--field-bg)] text-slate-400 transition hover:border-[var(--accent)]",
            shape === "circle" ? "rounded-full" : "rounded-2xl",
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pré-visualização" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl">+</span>
          )}
          {uploading ? (
            <div className="absolute inset-0 grid place-items-center bg-black/50">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          ) : null}
        </button>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            {preview ? "Trocar imagem" : "Enviar do computador"}
          </button>
          <button
            type="button"
            onClick={() => setLinkMode((current) => !current)}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            {linkMode ? "Cancelar link" : "Ou colar um link"}
          </button>
          {preview ? (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onChange(null);
              }}
              className="text-sm text-slate-400 hover:text-slate-200"
            >
              Remover
            </button>
          ) : null}
        </div>
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

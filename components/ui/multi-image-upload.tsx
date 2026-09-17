"use client";

import { X } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { uploadImage } from "@/lib/firebase/storage";
import { resizeImageToJpegBlob } from "@/lib/image-processing";

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
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  async function uploadOne(file: File) {
    // Converts HEIC (iPhone default, unreadable in most browsers) and caps
    // the size, without cropping — framing matters for progress photos.
    const blob = await resizeImageToJpegBlob(file);
    const resizedFile = new File([blob], "foto.jpg", { type: "image/jpeg" });
    return uploadImage(resizedFile, folder);
  }

  async function handleFiles(files: FileList) {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setUploadProgress({ done: 0, total: fileList.length });
    const urls: string[] = [];
    let failures = 0;

    for (const file of fileList) {
      try {
        urls.push(await uploadOne(file));
      } catch {
        failures += 1;
      }
      setUploadProgress((current) => (current ? { ...current, done: current.done + 1 } : current));
    }

    if (urls.length > 0) onChange([...values, ...urls]);
    if (failures > 0) {
      toast.error(
        failures === fileList.length
          ? "Não foi possível enviar as imagens."
          : `${failures} de ${fileList.length} imagens não puderam ser enviadas.`,
      );
    }
    setUploadProgress(null);
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
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--field-bg)] text-slate-400 transition hover:border-[var(--accent)]"
        >
          {uploadProgress ? (
            <div className="flex flex-col items-center gap-1">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {uploadProgress.total > 1 ? (
                <span className="text-[10px] text-slate-400">
                  {uploadProgress.done}/{uploadProgress.total}
                </span>
              ) : null}
            </div>
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
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = event.target.files;
          if (files && files.length > 0) handleFiles(files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

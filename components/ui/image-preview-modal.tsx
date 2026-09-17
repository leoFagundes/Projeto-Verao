"use client";

import { Modal } from "@/components/ui/modal";

/** Shows the photo the way it'll actually look, mirroring the real profile
 * card markup/proportions exactly — a plain zoomed-in `<img>` alone can be
 * misleading about crop/framing, since the card is circular/cropped and has
 * a gradient overlay + name underneath. */
export function ImagePreviewModal({
  open,
  imageUrl,
  name,
  onClose,
}: {
  open: boolean;
  imageUrl: string;
  name: string;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Pré-visualização do card">
      <div className="mx-auto max-w-[220px] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="relative overflow-hidden rounded-[22px]">
          <div className="h-52 w-full bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <h3 className="min-w-0 truncate text-xl font-semibold text-white">{name || "Seu perfil"}</h3>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm text-slate-950"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            →
          </div>
        </div>
      </div>
    </Modal>
  );
}

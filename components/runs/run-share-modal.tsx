"use client";

import { toPng } from "html-to-image";
import { Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { Profile } from "@/types/profile";
import type { Run } from "@/types/run";

import { RunShareCard } from "./run-share-card";

export function RunShareModal({
  run,
  profile,
  open,
  onClose,
}: {
  run: Run | null;
  profile?: Profile | null;
  open: boolean;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  async function handleShare() {
    if (!cardRef.current || !run) return;

    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const fileName = `corrida-${run.date}.png`;

      const canUseWebShare =
        typeof navigator !== "undefined" && "share" in navigator && "canShare" in navigator;

      if (canUseWebShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], fileName, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Corrida" });
          return;
        }
      }

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      link.click();
      toast.success("Imagem baixada!");
    } catch (error) {
      // AbortError just means the user cancelled the native share sheet.
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("Não foi possível gerar a imagem.");
    } finally {
      setGenerating(false);
    }
  }

  if (!run) return null;

  return (
    <Modal open={open} onClose={onClose} title="Compartilhar corrida">
      <div className="flex justify-center overflow-x-auto rounded-2xl bg-[var(--field-bg)] p-3 sm:p-4">
        <div ref={cardRef}>
          <RunShareCard run={run} profile={profile} />
        </div>
      </div>

      <Button onClick={handleShare} disabled={generating} className="mt-5 w-full">
        {generating ? (
          "Gerando imagem..."
        ) : (
          <span className="inline-flex items-center justify-center gap-2">
            <Share2 className="h-4 w-4" />
            Compartilhar imagem
          </span>
        )}
      </Button>
    </Modal>
  );
}

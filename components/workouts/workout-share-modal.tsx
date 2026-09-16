"use client";

import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { WorkoutSession } from "@/types/session";

import { WorkoutShareCard } from "./workout-share-card";

export function WorkoutShareModal({
  session,
  open,
  onClose,
}: {
  session: WorkoutSession | null;
  open: boolean;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  async function handleShare() {
    if (!cardRef.current || !session) return;

    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const fileName = `treino-${session.workoutName.toLowerCase().replace(/\s+/g, "-")}.png`;

      const canUseWebShare =
        typeof navigator !== "undefined" && "share" in navigator && "canShare" in navigator;

      if (canUseWebShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], fileName, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: session.workoutName });
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

  if (!session) return null;

  return (
    <Modal open={open} onClose={onClose} title="Compartilhar treino">
      <div className="flex justify-center overflow-x-auto rounded-2xl bg-[var(--field-bg)] p-3 sm:p-4">
        <div ref={cardRef}>
          <WorkoutShareCard session={session} />
        </div>
      </div>

      <Button onClick={handleShare} disabled={generating} className="mt-5 w-full">
        {generating ? "Gerando imagem..." : "📤 Compartilhar imagem"}
      </Button>
    </Modal>
  );
}

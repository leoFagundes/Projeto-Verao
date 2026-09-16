"use client";

import { Lock } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import type { Achievement, AchievementProgress } from "@/lib/achievements";
import { formatDateWithYear } from "@/lib/utils";

export function AchievementDetailModal({
  achievement,
  unlockedAt,
  progress,
  open,
  onClose,
}: {
  achievement: Achievement | null;
  unlockedAt: number | null;
  progress: AchievementProgress | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!achievement) return null;

  const isUnlocked = unlockedAt != null;
  const pct = progress ? Math.min(100, (progress.current / progress.target) * 100) : null;
  const decimals = progress?.unit === "km" ? 1 : 0;

  return (
    <Modal open={open} onClose={onClose} title={achievement.title}>
      <div className="flex flex-col items-center text-center">
        <div
          className="grid h-16 w-16 place-items-center rounded-full text-3xl"
          style={
            isUnlocked ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" } : undefined
          }
        >
          {isUnlocked ? achievement.icon : <Lock className="h-7 w-7 text-slate-600" />}
        </div>

        <p className="mt-3 text-sm text-slate-400">{achievement.description}</p>

        {isUnlocked ? (
          <p className="mt-4 rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-1.5 text-xs font-medium text-[var(--accent)]">
            Desbloqueada em {formatDateWithYear(unlockedAt)}
          </p>
        ) : progress ? (
          <div className="mt-5 w-full">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {progress.current.toFixed(decimals)} de {progress.target} {progress.unit}
              </span>
              <span className="font-medium text-white">{Math.round(pct ?? 0)}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--field-bg)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct ?? 0}%`,
                  background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
                }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-5 text-xs text-slate-500">Ainda não desbloqueada.</p>
        )}
      </div>
    </Modal>
  );
}

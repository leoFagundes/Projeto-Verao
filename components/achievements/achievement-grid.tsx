"use client";

import { motion } from "framer-motion";
import { Lock, Trophy } from "lucide-react";
import { useState } from "react";

import { ACHIEVEMENTS, achievementProgress, type Achievement } from "@/lib/achievements";
import type { BodyMeasurement } from "@/types/measurement";
import type { Run } from "@/types/run";
import type { WorkoutSession } from "@/types/session";
import { cn, formatDateWithYear } from "@/lib/utils";

import { AchievementDetailModal } from "./achievement-detail-modal";

export function AchievementGrid({
  unlocked,
  sessions,
  runs,
  measurements,
}: {
  unlocked: Map<string, number>;
  sessions: WorkoutSession[];
  runs: Run[];
  measurements: BodyMeasurement[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Achievement | null>(null);

  const sorted = [...ACHIEVEMENTS].sort((a, b) => {
    const dateA = unlocked.get(a.id);
    const dateB = unlocked.get(b.id);
    if (dateA != null && dateB != null) return dateB - dateA;
    if (dateA != null) return -1;
    if (dateB != null) return 1;
    return 0;
  });

  return (
    <div>
      <div className="relative">
        <div
          className={cn(
            "grid grid-cols-2 gap-3 sm:grid-cols-3",
            !expanded && "max-h-[400px] overflow-hidden",
          )}
        >
          {sorted.map((achievement, index) => {
            const unlockedAt = unlocked.get(achievement.id);
            const isUnlocked = unlockedAt != null;
            return (
              <motion.button
                key={achievement.id}
                type="button"
                onClick={() => setSelected(achievement)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 10) * 0.03, duration: 0.3 }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition",
                  isUnlocked
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)] bg-[var(--surface-2)] opacity-60 hover:opacity-80",
                )}
              >
                <div
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
                  style={
                    isUnlocked
                      ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }
                      : undefined
                  }
                >
                  {isUnlocked ? (
                    <Trophy className="h-6 w-6" style={{ color: "var(--bg)" }} />
                  ) : (
                    <Lock className="h-5 w-5 text-slate-600" />
                  )}
                </div>
                <p className={cn("text-xs font-semibold", isUnlocked ? "text-white" : "text-slate-400")}>
                  {achievement.title}
                </p>
                <p className="text-[10px] leading-snug text-slate-500">{achievement.description}</p>
                {isUnlocked ? (
                  <p className="text-[9.5px] font-medium text-[var(--accent)]">{formatDateWithYear(unlockedAt)}</p>
                ) : null}
              </motion.button>
            );
          })}
        </div>

        {!expanded ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 rounded-b-2xl"
            style={{ background: "linear-gradient(to top, var(--surface), transparent)" }}
          />
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="mt-3 w-full rounded-xl border border-[var(--border)] py-2 text-xs font-medium text-slate-300 transition hover:border-[var(--accent)] hover:text-white"
      >
        {expanded ? "Ver menos" : `Ver mais (${ACHIEVEMENTS.length} no total)`}
      </button>

      <AchievementDetailModal
        achievement={selected}
        unlockedAt={selected ? (unlocked.get(selected.id) ?? null) : null}
        progress={selected ? achievementProgress(selected.id, sessions, runs, measurements) : null}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

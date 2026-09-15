"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { THEME_META } from "@/lib/theme";
import type { Profile } from "@/types/profile";

export function ProfileCard({ profile, index }: { profile: Profile; index: number }) {
  const theme = THEME_META[profile.theme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
    >
      <Link
        href={`/perfil/${profile.id}`}
        data-theme={profile.theme}
        className="group block overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-3 transition duration-300 hover:border-[var(--accent)]"
      >
        <div className="relative overflow-hidden rounded-[22px]">
          <Avatar
            name={profile.name}
            photoUrl={profile.photoUrl}
            className="h-52 w-full transition duration-500 group-hover:scale-105"
            textClassName="text-6xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
          <div className="absolute left-3 top-3 rounded-full bg-slate-950/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-200">
            {theme.label}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <h3 className="min-w-0 truncate text-xl font-semibold text-white">{profile.name}</h3>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm text-slate-950"
            style={{ background: theme.gradient }}
          >
            →
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
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
        href={`/perfil/${profile.id}/treinos`}
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
          {profile.password ? (
            <div
              className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-slate-950/60 text-slate-200"
              aria-label="Perfil protegido por senha"
            >
              <Lock className="h-3.5 w-3.5" />
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <h3 className="min-w-0 truncate text-xl font-semibold text-white">{profile.name}</h3>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-950"
            style={{ background: theme.gradient }}
          >
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

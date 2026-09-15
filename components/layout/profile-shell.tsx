"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { Avatar } from "@/components/ui/avatar";
import { THEME_META } from "@/lib/theme";
import type { Profile } from "@/types/profile";

import { BottomNav, TopTabs } from "./bottom-nav";

export function ProfileShell({
  profile,
  children,
}: {
  profile: Profile;
  children: ReactNode;
}) {
  const theme = THEME_META[profile.theme];

  useEffect(() => {
    // Modals/toasts portal to document.body, outside this div, so CSS
    // variables scoped to [data-theme] here wouldn't reach them. Mirroring
    // the theme on <html> makes it cascade to portaled content too.
    document.documentElement.setAttribute("data-theme", profile.theme);
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, [profile.theme]);

  return (
    <div
      data-theme={profile.theme}
      className="min-h-dvh bg-[var(--bg)] text-white"
    >
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pb-16">
        <header className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-lg font-bold text-white transition hover:border-[var(--accent)]"
                aria-label="Voltar para a home"
              >
                ←
              </Link>
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  name={profile.name}
                  photoUrl={profile.photoUrl}
                  className="h-11 w-11 shrink-0 rounded-2xl"
                  textClassName="text-sm"
                />
                <div className="min-w-0">
                  {/* <p className="truncate text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                    {theme.label}
                  </p> */}
                  <h1 className="truncate text-lg font-semibold text-white">
                    {profile.name}
                  </h1>
                </div>
              </div>
            </div>

            <TopTabs profileId={profile.id} />
          </div>
        </header>

        <main className="mt-6">{children}</main>
      </div>

      <BottomNav profileId={profile.id} />
    </div>
  );
}

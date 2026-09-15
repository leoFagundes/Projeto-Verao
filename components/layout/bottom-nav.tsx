"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

function tabsFor(profileId: string) {
  return [
    { href: `/perfil/${profileId}/treinos`, label: "Treinos", icon: "🏋️" },
    { href: `/perfil/${profileId}/visao-geral`, label: "Visão geral", icon: "📊" },
    { href: `/perfil/${profileId}/corridas`, label: "Corridas", icon: "🏃" },
    { href: `/perfil/${profileId}/medidas`, label: "Medidas", icon: "⚖️" },
  ];
}

function isActive(pathname: string, href: string) {
  return pathname.startsWith(href);
}

export function BottomNav({ profileId }: { profileId: string }) {
  const pathname = usePathname();
  const tabs = tabsFor(profileId);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-strong)] bg-[var(--surface)]/95 shadow-[0_-16px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link key={tab.href} href={tab.href} className="relative flex-1">
              <motion.div
                whileTap={{ scale: 0.93 }}
                className="relative flex flex-col items-center gap-0.5 py-2"
              >
                {active ? (
                  <motion.span
                    layoutId="bottom-nav-active-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-x-1 inset-y-0 rounded-2xl"
                    style={{ background: "var(--accent-soft)" }}
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 text-[19px] leading-none transition-all duration-200",
                    active ? "scale-105 opacity-100" : "opacity-50",
                  )}
                >
                  {tab.icon}
                </span>
                <span
                  className={cn(
                    "relative z-10 text-[10.5px] font-medium transition-colors",
                    active ? "" : "text-slate-500",
                  )}
                  style={active ? { color: "var(--accent)" } : undefined}
                >
                  {tab.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopTabs({ profileId }: { profileId: string }) {
  const pathname = usePathname();
  const tabs = tabsFor(profileId);

  return (
    <div className="hidden rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1 sm:inline-flex">
      {tabs.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <Link key={tab.href} href={tab.href} className="relative">
            {active ? (
              <motion.span
                layoutId="top-tabs-active-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 block rounded-full px-4 py-2 text-sm font-medium transition",
                active ? "text-slate-950" : "text-slate-300 hover:text-white",
              )}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

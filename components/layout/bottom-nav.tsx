"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

function tabsFor(profileId: string) {
  return [
    { href: `/perfil/${profileId}`, label: "Visão geral", icon: "📊", exact: true },
    { href: `/perfil/${profileId}/treinos`, label: "Treinos", icon: "🏋️", exact: false },
    { href: `/perfil/${profileId}/corridas`, label: "Corridas", icon: "🏃", exact: false },
    { href: `/perfil/${profileId}/medidas`, label: "Medidas", icon: "⚖️", exact: false },
  ];
}

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export function BottomNav({ profileId }: { profileId: string }) {
  const pathname = usePathname();
  const tabs = tabsFor(profileId);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-strong)] bg-[var(--surface)] shadow-[0_-12px_30px_rgba(0,0,0,0.4)] sm:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href, tab.exact);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-slate-400"
            >
              <span
                className={cn("text-lg transition", active ? "scale-110" : "opacity-60")}
                style={active ? { filter: "none" } : undefined}
              >
                {tab.icon}
              </span>
              <span className={active ? "text-white" : ""} style={active ? { color: "var(--accent)" } : undefined}>
                {tab.label}
              </span>
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
        const active = isActive(pathname, tab.href, tab.exact);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              active ? "text-slate-950" : "text-slate-300 hover:text-white",
            )}
            style={
              active
                ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }
                : undefined
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Perfis" },
  { href: "/admin/exercicios", label: "Exercícios" },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1">
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <Link key={tab.href} href={tab.href} className="relative">
            {active ? (
              <motion.span
                layoutId="admin-tabs-active-pill"
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

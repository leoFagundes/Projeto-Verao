"use client";

import { motion } from "framer-motion";
import { Settings, Trophy } from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { ProfileCard } from "@/components/profile/profile-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useProfiles } from "@/lib/hooks/use-profiles";

export default function HomePage() {
  const { profiles, loading } = useProfiles();

  return (
    <main className="min-h-dvh bg-[var(--bg)] text-white">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <AppHeader
          eyebrow="Projeto Verão"
          title="Seu espaço de treino"
          action={
            <div className="flex items-center gap-2">
              <Link
                href="/painel"
                className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-white transition hover:border-[var(--accent)]"
                aria-label="Ver painel geral de todos os perfis"
              >
                <Trophy className="h-5 w-5" />
              </Link>
              <Link
                href="/admin"
                className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-white transition hover:border-[var(--accent)]"
                aria-label="Administrar perfis"
              >
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          }
        />

        <section className="mt-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Perfis
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            Quem vai treinar hoje?
          </h2>

          {loading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-[28px] bg-white/5"
                />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6"
            >
              <EmptyState
                title="Nenhum perfil criado ainda"
                description="Crie o primeiro perfil na área administrativa para começar a treinar."
                action={
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-slate-950"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--accent), var(--accent-2))",
                    }}
                  >
                    Criar perfil
                  </Link>
                }
              />
            </motion.div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile, index) => (
                <ProfileCard key={profile.id} profile={profile} index={index} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

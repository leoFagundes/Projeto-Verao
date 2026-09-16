"use client";

import { AppHeader } from "@/components/layout/app-header";
import { ProfileSummaryCard } from "@/components/profile/profile-summary-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useProfiles } from "@/lib/hooks/use-profiles";

export default function DashboardPage() {
  const { profiles, loading } = useProfiles();

  return (
    <main className="min-h-dvh bg-[var(--bg)] text-white">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <AppHeader eyebrow="Projeto Verão" title="Painel geral" backHref="/" />

        <section className="mt-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Todos os perfis</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Treinos, corridas e conquistas</h2>

          {loading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-[28px] bg-white/5" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Nenhum perfil criado ainda"
                description="Crie um perfil na área administrativa para ver o resumo aqui."
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile, index) => (
                <ProfileSummaryCard key={profile.id} profile={profile} index={index} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

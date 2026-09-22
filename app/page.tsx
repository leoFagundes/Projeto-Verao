"use client";

import { motion } from "framer-motion";
import { HelpCircle, Settings, Trophy, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/layout/app-header";
import { HelpModal } from "@/components/layout/help-modal";
import { ProfileCard } from "@/components/profile/profile-card";
import { ProfileForm } from "@/components/profile/profile-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip";
import { createProfile } from "@/lib/firebase/profiles";
import { useProfiles } from "@/lib/hooks/use-profiles";
import type { ProfileInput } from "@/types/profile";

export default function HomePage() {
  const { profiles, loading } = useProfiles();
  const [helpOpen, setHelpOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  async function handleCreate(values: ProfileInput) {
    try {
      await createProfile(values);
      toast.success("Perfil criado!");
      setCreateOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o perfil.");
    }
  }

  return (
    <main className="min-h-dvh bg-[var(--bg)] text-white">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <AppHeader
          eyebrow="Projeto Verão"
          title="Seu espaço de treino"
          action={
            <div className="flex items-center gap-2">
              <Tooltip label="Criar perfil" align="right">
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-white transition hover:border-[var(--accent)]"
                  aria-label="Criar perfil"
                >
                  <UserPlus className="h-5 w-5" />
                </button>
              </Tooltip>
              <Tooltip label="Painel geral" align="right">
                <Link
                  href="/painel"
                  className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-white transition hover:border-[var(--accent)]"
                  aria-label="Ver painel geral de todos os perfis"
                >
                  <Trophy className="h-5 w-5" />
                </Link>
              </Tooltip>
              <Tooltip label="Como o app funciona" align="right">
                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-white transition hover:border-[var(--accent)]"
                  aria-label="Como o app funciona"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </Tooltip>
              <Tooltip label="Administrar perfis" align="right">
                <Link
                  href="/admin"
                  className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-white transition hover:border-[var(--accent)]"
                  aria-label="Administrar perfis"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </Tooltip>
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

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Criar perfil">
        <ProfileForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>
    </main>
  );
}

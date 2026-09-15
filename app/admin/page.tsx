"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { AdminGate } from "@/components/layout/admin-gate";
import { AppHeader } from "@/components/layout/app-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, SectionLabel } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { createProfile, deleteProfile, updateProfile } from "@/lib/firebase/profiles";
import { useProfiles } from "@/lib/hooks/use-profiles";
import { THEME_META } from "@/lib/theme";
import type { Profile, ProfileInput } from "@/types/profile";

function AdminContent() {
  const { profiles, loading } = useProfiles();
  const [editing, setEditing] = useState<Profile | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Profile | null>(null);

  async function handleCreate(values: ProfileInput) {
    try {
      await createProfile(values);
      toast.success("Perfil criado!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o perfil.");
    }
  }

  async function handleUpdate(values: ProfileInput) {
    if (!editing) return;
    try {
      await updateProfile(editing.id, values, editing.photoUrl);
      toast.success("Perfil atualizado!");
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  }

  return (
    <main className="min-h-dvh bg-[var(--bg)] text-white">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <AppHeader
          eyebrow="Admin"
          title="Projeto Verão"
          action={
            <div className="flex items-center gap-2">
              <Link
                href="/admin/exercicios"
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-white transition hover:border-[var(--accent)]"
              >
                <span className="sm:hidden">Exercícios</span>
                <span className="hidden sm:inline">Biblioteca de exercícios</span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-white transition hover:border-[var(--accent)] sm:px-4"
              >
                <span className="sm:hidden">Voltar</span>
                <span className="hidden sm:inline">Voltar ao app</span>
              </Link>
            </div>
          }
        />

        <section className="mt-6">
          <Card className="p-5 sm:p-6">
            <SectionLabel>Painel administrativo</SectionLabel>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Criar perfil</h2>
            <div className="mt-6">
              <ProfileForm onSubmit={handleCreate} />
            </div>
          </Card>
        </section>

        <section className="mt-8">
          <SectionLabel>Perfis criados</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold text-white">Gerenciar perfis</h2>

          {loading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-[24px] bg-white/5" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Nenhum perfil cadastrado ainda"
                description="Use o formulário acima para começar."
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  data-theme={profile.theme}
                  className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-3"
                >
                  <div className="overflow-hidden rounded-[18px]">
                    <Avatar
                      name={profile.name}
                      photoUrl={profile.photoUrl}
                      className="h-32 w-full"
                      textClassName="text-4xl"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-white">{profile.name}</h3>
                      <p className="text-xs text-slate-400">{THEME_META[profile.theme].label}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditing(profile)}>
                      Editar
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setPendingDelete(profile)}>
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Editar perfil">
        {editing ? (
          <ProfileForm
            initialValues={{ name: editing.name, photoUrl: editing.photoUrl, theme: editing.theme }}
            submitLabel="Salvar alterações"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remover perfil"
        description={`Tem certeza que deseja remover "${pendingDelete?.name}"? Todos os treinos, sessões e corridas desse perfil também serão apagados.`}
        confirmLabel="Remover"
        danger
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteProfile(pendingDelete)
            .then(() => toast.success("Perfil removido."))
            .catch(() => toast.error("Não foi possível remover o perfil."));
        }}
      />
    </main>
  );
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminContent />
    </AdminGate>
  );
}

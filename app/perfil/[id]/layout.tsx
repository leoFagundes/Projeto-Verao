"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ProfilePasswordGate } from "@/components/layout/profile-password-gate";
import { ProfileShell } from "@/components/layout/profile-shell";
import { useProfile } from "@/lib/hooks/use-profile";

export default function ProfileLayout({ children }: LayoutProps<"/perfil/[id]">) {
  const params = useParams<{ id: string }>();
  const { profile, loading } = useProfile(params.id);

  if (loading) {
    return <div className="min-h-dvh bg-[var(--bg)]" />;
  }

  if (!profile) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)] px-4 text-white">
        <div className="w-full max-w-sm rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Perfil não encontrado</p>
          <h1 className="mt-3 text-2xl font-bold text-white">
            Não foi possível localizar este perfil.
          </h1>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Voltar para a home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <ProfilePasswordGate profile={profile}>
      <ProfileShell profile={profile}>{children}</ProfileShell>
    </ProfilePasswordGate>
  );
}

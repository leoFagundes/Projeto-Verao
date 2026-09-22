"use client";

import { useParams } from "next/navigation";
import { toast } from "sonner";

import { AccountLinkSection } from "@/components/profile/account-link-section";
import { ProfileForm } from "@/components/profile/profile-form";
import { SessionSection } from "@/components/profile/session-section";
import { Card, SectionLabel } from "@/components/ui/card";
import { updateProfile } from "@/lib/firebase/profiles";
import { useProfile } from "@/lib/hooks/use-profile";
import type { ProfileInput } from "@/types/profile";

export default function ProfileSettingsPage() {
  const params = useParams<{ id: string }>();
  const { profile, loading } = useProfile(params.id);

  async function handleUpdate(values: ProfileInput) {
    if (!profile) return;
    try {
      await updateProfile(profile.id, values, profile.photoUrl);
      toast.success("Perfil atualizado!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  }

  if (loading || !profile) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-white/5" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Configurações</SectionLabel>
        <h2 className="mt-2 text-2xl font-semibold text-white">Seu perfil</h2>
      </div>

      <Card className="p-5 sm:p-6">
        <ProfileForm
          initialValues={{
            name: profile.name,
            photoUrl: profile.photoUrl,
            theme: profile.theme,
            password: profile.password,
            allowSharedWorkouts: profile.allowSharedWorkouts,
          }}
          submitLabel="Salvar alterações"
          onSubmit={handleUpdate}
        />
      </Card>

      <AccountLinkSection profile={profile} />

      <SessionSection profile={profile} />
    </div>
  );
}

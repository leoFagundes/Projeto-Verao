"use client";

import type { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, SectionLabel } from "@/components/ui/card";
import { endProfileGoogleSession, renewProfileGoogleSession, subscribeProfileGoogleUser } from "@/lib/firebase/profile-auth";
import { clearSession, getSessionExpiry, markSessionUnlocked } from "@/lib/session-unlock";
import type { Profile } from "@/types/profile";

function formatWhen(date: Date) {
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const isToday = date.toDateString() === new Date().toDateString();
  if (isToday) return `hoje às ${time}`;
  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às ${time}`;
}

/** Every way of unlocking a profile on this device (PIN, and Google if
 * linked) has its own independent session — this shows each one's status
 * and lets it be renewed (more time without re-entering) or ended (force
 * asking again next time) on its own, without necessarily touching the
 * other. Only rendered when there's at least one to show. */
export function SessionSection({ profile }: { profile: Profile }) {
  const hasPassword = Boolean(profile.password);
  const isGoogleLinked = profile.linkedAuth?.provider === "google";
  const storageKey = `projeto-verao-profile-unlocked-${profile.id}`;

  const [pinExpiry, setPinExpiry] = useState<Date | null>(null);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    if (!hasPassword) return;
    // localStorage only exists client-side, so this can't be read during
    // render (would break SSR) — the effect is the correct place for it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPinExpiry(getSessionExpiry(storageKey));
  }, [hasPassword, storageKey]);

  useEffect(() => {
    if (!isGoogleLinked) return;
    return subscribeProfileGoogleUser(profile.id, setGoogleUser);
  }, [isGoogleLinked, profile.id]);

  function handleRenewPin() {
    markSessionUnlocked(storageKey);
    const expiry = getSessionExpiry(storageKey);
    setPinExpiry(expiry);
    toast.success(expiry ? `Sessão de senha renovada — válida até ${formatWhen(expiry)}.` : "Sessão renovada.");
  }

  function handleEndPin() {
    clearSession(storageKey);
    toast.success("Sessão de senha encerrada.");
    // The lock state itself lives in ProfilePasswordGate's own React state,
    // higher up the tree, so it won't notice localStorage changing on its
    // own — reloading is what makes the lock actually take effect right
    // now instead of only on the next visit.
    window.location.reload();
  }

  async function handleRenewGoogle() {
    setGoogleBusy(true);
    try {
      const expiresAt = await renewProfileGoogleSession(profile.id);
      toast.success(
        expiresAt ? `Sessão do Google renovada — válida até ${formatWhen(expiresAt)}.` : "Nenhuma sessão ativa pra renovar.",
      );
    } catch {
      toast.error("Não foi possível renovar a sessão.");
    } finally {
      setGoogleBusy(false);
    }
  }

  async function handleEndGoogle() {
    setGoogleBusy(true);
    try {
      await endProfileGoogleSession(profile.id);
      toast.success("Sessão do Google encerrada.");
      window.location.reload();
    } catch {
      toast.error("Não foi possível encerrar a sessão.");
    } finally {
      setGoogleBusy(false);
    }
  }

  if (!hasPassword && !isGoogleLinked) return null;

  return (
    <Card className="p-5 sm:p-6">
      <SectionLabel>Sessão</SectionLabel>
      <h3 className="mt-2 text-lg font-semibold text-white">Controlar sessão neste aparelho</h3>
      <p className="mt-1 text-sm text-slate-400">
        Cada forma de entrar tem sua própria sessão neste aparelho — dá pra renovar (ganhar mais tempo sem digitar
        de novo) ou encerrar (pedir de novo já na próxima vez) cada uma.
      </p>

      <div className="mt-4 space-y-3">
        {hasPassword ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
            <p className="text-sm font-medium text-white">Senha</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {pinExpiry ? `Desbloqueada até ${formatWhen(pinExpiry)}` : "Não desbloqueada neste aparelho agora"}
            </p>
            {pinExpiry ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={handleRenewPin}>
                  Renovar sessão
                </Button>
                <Button variant="secondary" size="sm" onClick={handleEndPin}>
                  Encerrar sessão
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {isGoogleLinked ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
            <p className="flex items-center gap-1.5 text-sm font-medium text-white">
              <FcGoogle className="h-4 w-4" />
              Google
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {googleUser ? "Sessão ativa neste dispositivo" : "Sem sessão ativa neste dispositivo"}
            </p>
            {googleUser ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={handleRenewGoogle} disabled={googleBusy}>
                  Renovar sessão
                </Button>
                <Button variant="secondary" size="sm" onClick={handleEndGoogle} disabled={googleBusy}>
                  Encerrar sessão
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

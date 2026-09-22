"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { verifyProfileEmailPassword } from "@/lib/firebase/account-link";
import { updateProfile } from "@/lib/firebase/profiles";
import { signInProfileWithGoogle, subscribeProfileGoogleUser } from "@/lib/firebase/profile-auth";
import { isSessionUnlocked, markSessionUnlocked } from "@/lib/session-unlock";
import type { Profile } from "@/types/profile";

function googleSignInErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return "Login cancelado.";
  }
  return "Não foi possível entrar com o Google.";
}

/** Signs in with the profile's linked Google account and confirms it's
 * really the one linked (not some other Google account) — shared between
 * the direct "Entrar com Google" button and the recovery flow below. */
async function signInAndMatchLinkedGoogle(profile: Profile): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!profile.linkedAuth || profile.linkedAuth.provider !== "google") {
    return { ok: false, message: "Este perfil não tem uma conta Google vinculada." };
  }
  try {
    const user = await signInProfileWithGoogle(profile.id);
    if (user.email && user.email.toLowerCase() === profile.linkedAuth.email.toLowerCase()) {
      return { ok: true };
    }
    return { ok: false, message: "Essa conta Google não é a vinculada a este perfil." };
  } catch (error) {
    return { ok: false, message: googleSignInErrorMessage(error) };
  }
}

type RecoverStep = "verify" | "new-password";

/** Shown instead of the password form when "Esqueci minha senha" is tapped.
 * Proves identity via whatever recovery identity is linked to the profile
 * (see AccountLinkSection/configuracoes), then lets a new PIN be set — all
 * without ever touching the app's own device-wide anonymous session. */
function RecoverPasswordFlow({
  profile,
  onBack,
  onRecovered,
}: {
  profile: Profile;
  onBack: () => void;
  onRecovered: () => void;
}) {
  const linkedAuth = profile.linkedAuth;
  const [step, setStep] = useState<RecoverStep>("verify");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerifyEmail(event: FormEvent) {
    event.preventDefault();
    if (!linkedAuth) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await verifyProfileEmailPassword(linkedAuth.email, password);
      if (ok) setStep("new-password");
      else setError("E-mail ou senha incorretos.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyGoogle() {
    setBusy(true);
    setError(null);
    try {
      const result = await signInAndMatchLinkedGoogle(profile);
      if (result.ok) setStep("new-password");
      else setError(result.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSetNewPassword(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateProfile(profile.id, { password: newPassword || null });
      onRecovered();
    } catch {
      setError("Não foi possível salvar a nova senha.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar
      </button>

      {!linkedAuth ? (
        <p className="text-sm text-slate-300">
          Este perfil ainda não tem uma forma de recuperação configurada. Peça pra alguém com acesso a ele definir
          uma nova senha, ou entre e configure uma em Configurações.
        </p>
      ) : step === "verify" ? (
        linkedAuth.provider === "google" ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">
              Entre com a conta Google vinculada (<span className="text-white">{linkedAuth.email}</span>) para
              confirmar que é você.
            </p>
            <Button type="button" variant="secondary" className="w-full" onClick={handleVerifyGoogle} disabled={busy}>
              <FcGoogle className="h-4 w-4" />
              {busy ? "Verificando..." : "Continuar com Google"}
            </Button>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
          </div>
        ) : (
          <form onSubmit={handleVerifyEmail} className="space-y-3">
            <p className="text-sm text-slate-300">
              Digite a senha do e-mail vinculado (<span className="text-white">{linkedAuth.email}</span>) para
              confirmar que é você.
            </p>
            <Field label="Senha do e-mail vinculado">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
                required
              />
            </Field>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Verificando..." : "Verificar"}
            </Button>
          </form>
        )
      ) : (
        <form onSubmit={handleSetNewPassword} className="space-y-3">
          <p className="text-sm text-slate-300">Identidade confirmada! Defina a nova senha deste perfil.</p>
          <Field label="Nova senha">
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoFocus
              required
            />
          </Field>
          <Field label="Confirmar nova senha">
            <Input
              type="password"
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              required
            />
          </Field>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      )}
    </div>
  );
}

/** Soft PIN gate for a profile — same client-side model as AdminGate, not
 * real auth. Unlocking via the PIN lasts 24h (stored in localStorage), not
 * just the current tab, so it isn't asked again every time the app is
 * reopened. A profile with a linked Google account also gets a persistent,
 * renewable real session (see profile-auth.ts) as an alternative to the
 * PIN — either one unlocks it. */
export function ProfilePasswordGate({ profile, children }: { profile: Profile; children: ReactNode }) {
  const hasPassword = Boolean(profile.password);
  const hasGoogleLink = profile.linkedAuth?.provider === "google";
  const storageKey = `projeto-verao-profile-unlocked-${profile.id}`;

  const [pinUnlocked, setPinUnlocked] = useState(!hasPassword);
  const [checked, setChecked] = useState(!hasPassword);
  const [googleUnlocked, setGoogleUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [view, setView] = useState<"password" | "recover">("password");
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPassword) return;
    // localStorage only exists client-side, so this can't be read during
    // render (would break SSR) — the effect is the correct place for it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPinUnlocked(isSessionUnlocked(storageKey));
    setChecked(true);
  }, [hasPassword, storageKey]);

  useEffect(() => {
    if (!hasGoogleLink) return;
    const linkedEmail = profile.linkedAuth?.email.toLowerCase();
    return subscribeProfileGoogleUser(profile.id, (user) => {
      setGoogleUnlocked(Boolean(user?.email && user.email.toLowerCase() === linkedEmail));
    });
  }, [hasGoogleLink, profile.id, profile.linkedAuth?.email]);

  const unlocked = pinUnlocked || googleUnlocked;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (input === profile.password) {
      markSessionUnlocked(storageKey);
      setPinUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  async function handleGoogleEntry() {
    setGoogleBusy(true);
    setGoogleError(null);
    try {
      const result = await signInAndMatchLinkedGoogle(profile);
      if (!result.ok) setGoogleError(result.message);
      // On success, the subscribeProfileGoogleUser listener above picks up
      // the new signed-in state and unlocks — no need to set it here too.
    } finally {
      setGoogleBusy(false);
    }
  }

  if (!checked) return null;

  if (!unlocked) {
    return (
      <div data-theme={profile.theme} className="grid min-h-dvh place-items-center bg-[var(--bg)] px-4 text-white">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a home
          </Link>
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            {view === "recover" ? "Recuperar senha" : "Perfil protegido"}
          </p>
          <h1 className="mt-2 text-xl font-bold text-white">
            {view === "recover" ? profile.name : `Senha de ${profile.name}`}
          </h1>

          <div className="mt-5">
            {view === "password" ? (
              <>
                <form onSubmit={handleSubmit}>
                  <Field label="Senha">
                    <Input
                      type="password"
                      value={input}
                      onChange={(event) => {
                        setInput(event.target.value);
                        setError(false);
                      }}
                      autoFocus
                    />
                  </Field>
                  {error ? <p className="mt-2 text-sm text-red-300">Senha incorreta.</p> : null}
                  <Button type="submit" className="mt-5 w-full">
                    Entrar
                  </Button>
                </form>

                {hasGoogleLink ? (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="h-px flex-1 bg-[var(--border)]" />
                      ou
                      <span className="h-px flex-1 bg-[var(--border)]" />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-4 w-full"
                      onClick={handleGoogleEntry}
                      disabled={googleBusy}
                    >
                      <FcGoogle className="h-4 w-4" />
                      {googleBusy ? "Entrando..." : "Entrar com Google"}
                    </Button>
                    {googleError ? <p className="mt-2 text-sm text-red-300">{googleError}</p> : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setView("recover")}
                  className="mt-4 block w-full text-center text-xs font-medium text-slate-400 hover:text-white"
                >
                  Esqueci minha senha
                </button>
              </>
            ) : (
              <RecoverPasswordFlow
                profile={profile}
                onBack={() => setView("password")}
                onRecovered={() => {
                  markSessionUnlocked(storageKey);
                  setPinUnlocked(true);
                  toast.success("Senha redefinida! Você já está dentro.");
                }}
              />
            )}
          </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

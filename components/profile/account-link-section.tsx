"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, SectionLabel } from "@/components/ui/card";
import { linkProfileGoogle } from "@/lib/firebase/account-link";
import { setProfileLinkedAuth } from "@/lib/firebase/profiles";
import type { Profile } from "@/types/profile";

/*
 * Linking via e-mail+password is intentionally disabled for now — Google
 * only, until that's settled. The underlying support (linkProfileEmailPassword,
 * verifyProfileEmailPassword) is still implemented in lib/firebase/account-link.ts
 * and the recovery flow in profile-password-gate.tsx still honors an
 * existing `provider: "password"` link if one is already on a profile — only
 * the UI for creating a NEW one lives here, commented out:
 *
 *   const [mode, setMode] = useState<"idle" | "email">("idle");
 *   const [email, setEmail] = useState("");
 *   const [password, setPassword] = useState("");
 *   const [confirmPassword, setConfirmPassword] = useState("");
 *
 *   async function handleEmailSubmit(event: FormEvent) {
 *     event.preventDefault();
 *     if (password !== confirmPassword) {
 *       toast.error("As senhas não coincidem.");
 *       return;
 *     }
 *     setSubmitting(true);
 *     try {
 *       await linkProfileEmailPassword(profile.id, email.trim(), password);
 *       toast.success("E-mail vinculado!");
 *       setMode("idle");
 *       setEmail("");
 *       setPassword("");
 *       setConfirmPassword("");
 *     } catch (error) {
 *       toast.error(error instanceof Error ? error.message : "Não foi possível vincular.");
 *     } finally {
 *       setSubmitting(false);
 *     }
 *   }
 *
 *   // ...and, in the "not linked yet" branch below:
 *   // mode === "email" ? (
 *   //   <form onSubmit={handleEmailSubmit} className="mt-4 space-y-3">
 *   //     <Field label="E-mail"><Input type="email" value={email} onChange={...} required autoFocus /></Field>
 *   //     <Field label="Senha"><Input type="password" value={password} onChange={...} required minLength={6} /></Field>
 *   //     <Field label="Confirmar senha"><Input type="password" value={confirmPassword} onChange={...} required minLength={6} /></Field>
 *   //     <Button type="submit">Vincular</Button>
 *   //     <Button type="button" variant="secondary" onClick={() => setMode("idle")}>Cancelar</Button>
 *   //   </form>
 *   // ) : (
 *   //   <Button variant="secondary" onClick={() => setMode("email")}>
 *   //     <Mail className="h-4 w-4" /> Vincular e-mail e senha
 *   //   </Button>
 *   // )
 */

/** Lets a profile optionally link a real Google account — purely for
 * resetting a forgotten PIN later, or as a faster way in. Never required to
 * use the app day to day, which stays exactly as frictionless as before.
 * Session status/renew/end controls for it live in SessionSection, not
 * here — this is just about creating or removing the link itself. */
export function AccountLinkSection({ profile }: { profile: Profile }) {
  const [submitting, setSubmitting] = useState(false);

  async function handleLinkGoogle() {
    setSubmitting(true);
    try {
      await linkProfileGoogle(profile.id);
      toast.success("Conta Google vinculada!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível vincular.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnlink() {
    setSubmitting(true);
    try {
      await setProfileLinkedAuth(profile.id, null);
      toast.success("Vínculo removido.");
    } catch {
      toast.error("Não foi possível remover o vínculo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <SectionLabel>Recuperação</SectionLabel>
      <h3 className="mt-2 text-lg font-semibold text-white">Conta vinculada</h3>
      <p className="mt-1 text-sm text-slate-400">
        Vincule uma conta Google a este perfil para dar pra recuperar a senha se esquecer, ou entrar mais rápido.
        Sem isso vinculado, entrar no dia a dia continua do jeito simples de sempre — só tocar no perfil.
      </p>

      {profile.linkedAuth ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <FcGoogle className="h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{profile.linkedAuth.email}</p>
              <p className="text-xs text-slate-400">Vinculado via Google</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleUnlink} disabled={submitting}>
            Desvincular
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <Button variant="secondary" className="w-full" onClick={handleLinkGoogle} disabled={submitting}>
            <FcGoogle className="h-4 w-4" />
            {submitting ? "Vinculando..." : "Vincular com Google"}
          </Button>
        </div>
      )}
    </Card>
  );
}

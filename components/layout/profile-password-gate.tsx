"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { Profile } from "@/types/profile";

/** Soft PIN gate for a profile — same client-side model as AdminGate, not real auth. */
export function ProfilePasswordGate({ profile, children }: { profile: Profile; children: ReactNode }) {
  const hasPassword = Boolean(profile.password);
  const storageKey = `projeto-verao-profile-unlocked-${profile.id}`;

  const [unlocked, setUnlocked] = useState(!hasPassword);
  const [checked, setChecked] = useState(!hasPassword);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!hasPassword) return;
    // sessionStorage only exists client-side, so this can't be read during
    // render (would break SSR) — the effect is the correct place for it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUnlocked(sessionStorage.getItem(storageKey) === "true");
    setChecked(true);
  }, [hasPassword, storageKey]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (input === profile.password) {
      sessionStorage.setItem(storageKey, "true");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!checked) return null;

  if (!unlocked) {
    return (
      <div data-theme={profile.theme} className="grid min-h-dvh place-items-center bg-[var(--bg)] px-4 text-white">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)]"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Perfil protegido</p>
          <h1 className="mt-2 text-xl font-bold text-white">Senha de {profile.name}</h1>
          <div className="mt-5">
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
          </div>
          <Button type="submit" className="mt-5 w-full">
            Entrar
          </Button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

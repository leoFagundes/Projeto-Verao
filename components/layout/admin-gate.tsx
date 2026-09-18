"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { isSessionUnlocked, markSessionUnlocked } from "@/lib/session-unlock";

const SESSION_KEY = "projeto-verao-admin-unlocked";

/** Same soft-passcode gate as ProfilePasswordGate — unlocking lasts 24h
 * (localStorage), not just the current tab. */
export function AdminGate({ children }: { children: ReactNode }) {
  const passcode = process.env.NEXT_PUBLIC_ADMIN_PASSCODE;
  const [unlocked, setUnlocked] = useState(!passcode);
  const [checked, setChecked] = useState(!passcode);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!passcode) return;
    // localStorage only exists client-side, so this can't be read during
    // render (would break SSR) — the effect is the correct place for it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUnlocked(isSessionUnlocked(SESSION_KEY));
    setChecked(true);
  }, [passcode]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (input === passcode) {
      markSessionUnlocked(SESSION_KEY);
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!checked) return null;

  if (!unlocked) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[var(--bg)] px-4 text-white">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)]"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Área restrita</p>
          <h1 className="mt-2 text-xl font-bold text-white">Acesso administrativo</h1>
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

"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { Profile } from "@/types/profile";

/** Re-asks a password-protected profile's own password before letting
 * someone else edit or delete it from the admin panel — same soft-PIN model
 * as ProfilePasswordGate, not real auth. Give this a fresh `key` per profile
 * at the call site so its input/error state resets between prompts. */
export function PasswordConfirmModal({
  profile,
  title,
  onConfirm,
  onClose,
}: {
  profile: Profile | null;
  title: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    if (input === profile.password) {
      onConfirm();
    } else {
      setError(true);
    }
  }

  if (!profile) return null;

  return (
    <Modal open={profile !== null} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-400">
          Este perfil é protegido por senha. Confirme a senha de <span className="text-white">{profile.name}</span>{" "}
          para continuar.
        </p>
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
        {error ? <p className="text-sm text-red-300">Senha incorreta.</p> : null}
        <Button type="submit" className="w-full">
          Confirmar
        </Button>
      </form>
    </Modal>
  );
}

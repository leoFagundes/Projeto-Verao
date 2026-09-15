"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";

import { ensureAnonymousAuth } from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/client";

function SetupScreen() {
  const steps = [
    "Crie um projeto em console.firebase.google.com",
    "Registre um Web App e copie as credenciais",
    "Crie o arquivo .env.local na raiz do projeto com as chaves NEXT_PUBLIC_FIREBASE_*",
    "Ative Firestore Database, Storage e o método de login Anônimo em Authentication",
    "Reinicie o servidor (npm run dev)",
  ];

  return (
    <div className="grid min-h-dvh place-items-center bg-[var(--bg)] px-4 text-white">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)] sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-indigo-300">Configuração necessária</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Conecte o Firebase</h1>
        <p className="mt-3 text-sm text-slate-400">
          O Projeto Verão precisa de um projeto Firebase para guardar perfis, treinos e corridas.
        </p>
        <ol className="mt-5 space-y-3 text-sm text-slate-300">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--accent)]">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-xs text-slate-500">
          Veja o arquivo .env.local.example na raiz do projeto para o formato exato das variáveis.
        </p>
      </div>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (isFirebaseConfigured) {
      ensureAnonymousAuth();
    }
  }, []);

  if (!isFirebaseConfigured) {
    return <SetupScreen />;
  }

  return (
    <>
      {children}
      <Toaster theme="dark" position="top-center" richColors />
    </>
  );
}

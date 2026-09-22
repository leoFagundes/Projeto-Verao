import { deleteApp, initializeApp } from "firebase/app";
import {
  type Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  getAuth as getAuthForApp,
} from "firebase/auth";

import { firebaseConfig, isFirebaseConfigured } from "./client";
import { setProfileLinkedAuth } from "./profiles";
import { signInProfileWithGoogle } from "./profile-auth";

/**
 * Linking or verifying a profile's recovery identity must never touch the
 * app's own device-wide anonymous session — every profile on this device
 * shares that one signed-in state, so signing in as someone else there
 * would sign everyone else out too. The email/password functions below each
 * spin up an isolated, throwaway secondary Firebase App + Auth instance just
 * for the one operation, then tear it down right after. Google instead goes
 * through the persistent per-profile instance in profile-auth.ts, since
 * linking with Google and being "signed in with Google" for that profile are
 * really the same underlying session.
 */
async function withSecondaryAuth<T>(fn: (auth: Auth) => Promise<T>): Promise<T> {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase não está configurado. Configure as variáveis de ambiente para continuar.");
  }
  const name = `account-link-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const secondaryApp = initializeApp(firebaseConfig, name);
  const secondaryAuth = getAuthForApp(secondaryApp);
  try {
    return await fn(secondaryAuth);
  } finally {
    try {
      await signOut(secondaryAuth);
    } catch {
      // Ignore — the app instance is being torn down right after anyway.
    }
    try {
      await deleteApp(secondaryApp);
    } catch {
      // Ignore — worst case this one throwaway instance leaks for the rest
      // of the page's lifetime, which is harmless.
    }
  }
}

function friendlyAuthError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case "auth/email-already-in-use":
      return "Esse e-mail já está vinculado a outro perfil ou conta.";
    case "auth/weak-password":
      return "Senha muito fraca — use pelo menos 6 caracteres.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-mail ou senha incorretos.";
    case "auth/user-not-found":
      return "Não encontramos uma conta com esse e-mail.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Login cancelado.";
    default:
      return "Não foi possível concluir. Tente novamente.";
  }
}

/** Creates a real, standalone Firebase Auth account with this email/password
 * and remembers it on the profile — later, the same email+password can be
 * used to verify identity and reset a forgotten PIN.
 *
 * Not currently wired up to any UI — linking is Google-only for now (see
 * AccountLinkSection), this is kept ready to re-enable later. */
export async function linkProfileEmailPassword(profileId: string, email: string, password: string) {
  try {
    await withSecondaryAuth((auth) => createUserWithEmailAndPassword(auth, email, password));
  } catch (error) {
    throw new Error(friendlyAuthError(error));
  }
  await setProfileLinkedAuth(profileId, { provider: "password", email });
}

/** Used during password recovery — proves the linked email+password is
 * actually known, without ever touching the app's main session.
 *
 * Not currently reachable from any UI — see linkProfileEmailPassword. */
export async function verifyProfileEmailPassword(email: string, password: string): Promise<boolean> {
  try {
    await withSecondaryAuth((auth) => signInWithEmailAndPassword(auth, email, password));
    return true;
  } catch {
    return false;
  }
}

/** Signs in with Google (popup, persistent per-profile session — see
 * profile-auth.ts) and remembers that account's email on the profile —
 * later, signing in with the same Google account both verifies identity to
 * reset a forgotten PIN and doubles as the "Entrar com Google" session
 * itself. */
export async function linkProfileGoogle(profileId: string) {
  let email: string | null;
  try {
    const user = await signInProfileWithGoogle(profileId);
    email = user.email;
  } catch (error) {
    throw new Error(friendlyAuthError(error));
  }
  if (!email) throw new Error("Não foi possível obter o e-mail da conta Google.");
  await setProfileLinkedAuth(profileId, { provider: "google", email });
}

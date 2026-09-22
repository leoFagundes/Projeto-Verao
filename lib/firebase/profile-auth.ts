import { getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onIdTokenChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";

import { firebaseConfig, isFirebaseConfigured } from "./client";

function appNameFor(profileId: string) {
  return `profile-auth-${profileId}`;
}

/**
 * One persistent (not throwaway) secondary Firebase App + Auth instance per
 * profile — backs "Entrar com Google" and the session controls in
 * Configurações. Deliberately separate from the device-wide anonymous
 * session every profile on this device shares (see lib/firebase/auth.ts):
 * signing in as one profile's Google account this way never affects any
 * other profile, or the app's own Firestore access. `browserLocalPersistence`
 * is what makes this a real, renewable session that survives reloads,
 * instead of just a one-off popup check.
 */
function profileAuth(profileId: string): Auth | null {
  if (!isFirebaseConfigured) return null;
  const name = appNameFor(profileId);
  const app = getApps().find((item) => item.name === name) ?? initializeApp(firebaseConfig, name);
  return getAuth(app);
}

export async function signInProfileWithGoogle(profileId: string): Promise<User> {
  const auth = profileAuth(profileId);
  if (!auth) throw new Error("Firebase não está configurado.");
  await setPersistence(auth, browserLocalPersistence);
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return result.user;
}

/** Fires immediately with whatever's already known, then again on every
 * change — including the async restore from persisted storage on first
 * load, which is why this is a subscription rather than a plain getter. */
export function subscribeProfileGoogleUser(profileId: string, callback: (user: User | null) => void) {
  const auth = profileAuth(profileId);
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onIdTokenChanged(auth, callback);
}

/** Forces a fresh ID token from Firebase right now instead of waiting on the
 * SDK's silent background refresh — gives "Renovar sessão" something real
 * to do, and a fresh expiration time to show for it. Returns null if there's
 * no active session to renew. */
export async function renewProfileGoogleSession(profileId: string): Promise<Date | null> {
  const user = profileAuth(profileId)?.currentUser;
  if (!user) return null;
  await user.getIdToken(true);
  const result = await user.getIdTokenResult();
  return new Date(result.expirationTime);
}

export async function endProfileGoogleSession(profileId: string) {
  const auth = profileAuth(profileId);
  if (!auth) return;
  await signOut(auth);
}

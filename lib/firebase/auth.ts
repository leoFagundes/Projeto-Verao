import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";

import { auth, isFirebaseConfigured } from "./client";

let pending: Promise<User | null> | null = null;

export function ensureAnonymousAuth(): Promise<User | null> {
  if (!isFirebaseConfigured || !auth) return Promise.resolve(null);
  if (auth.currentUser) return Promise.resolve(auth.currentUser);

  if (!pending) {
    pending = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth!, (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
          return;
        }

        signInAnonymously(auth!).catch(() => {
          unsubscribe();
          resolve(null);
        });
      });
    });
  }

  return pending;
}

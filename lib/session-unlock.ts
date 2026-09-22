const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

/** When a password/passcode gate stored under `key` expires, or null if it's
 * not currently unlocked (missing or expired — cleaned up either way). */
export function getSessionExpiry(key: string): Date | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const expiresAt = Number(raw);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    return new Date(expiresAt);
  } catch {
    return null;
  }
}

/** Whether a password/passcode gate stored under `key` is still within its
 * 24h window — lets AdminGate/ProfilePasswordGate stay unlocked across app
 * restarts instead of re-asking every time the tab/PWA is reopened. */
export function isSessionUnlocked(key: string): boolean {
  return getSessionExpiry(key) != null;
}

export function markSessionUnlocked(key: string) {
  try {
    localStorage.setItem(key, String(Date.now() + SESSION_DURATION_MS));
  } catch {
    // Best-effort — private browsing / full storage just means it re-asks next time.
  }
}

/** Ends the unlocked session right now instead of waiting for it to expire
 * — used by the "Encerrar sessão" control in Configurações. */
export function clearSession(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Best-effort — worst case it just expires normally later.
  }
}

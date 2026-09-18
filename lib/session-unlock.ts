const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

/** Whether a password/passcode gate stored under `key` is still within its
 * 24h window — lets AdminGate/ProfilePasswordGate stay unlocked across app
 * restarts instead of re-asking every time the tab/PWA is reopened. */
export function isSessionUnlocked(key: string): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const expiresAt = Number(raw);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      localStorage.removeItem(key);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function markSessionUnlocked(key: string) {
  try {
    localStorage.setItem(key, String(Date.now() + SESSION_DURATION_MS));
  } catch {
    // Best-effort — private browsing / full storage just means it re-asks next time.
  }
}

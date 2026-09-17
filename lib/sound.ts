/** Plays a short one-off sound effect at a low, non-intrusive volume.
 * Best-effort: browsers can block autoplay before any user gesture, and
 * a sound cue is never worth crashing the app over. */
export function playSound(src: string, volume = 0.35) {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch {
    // Ignore — e.g. Audio unsupported in this environment.
  }
}

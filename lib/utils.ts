export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function generateId() {
  return crypto.randomUUID();
}

export function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function formatDateWithYear(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateLong(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDateInput(timestamp: number) {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1).getTime();
}

export function formatPace(secPerKm: number) {
  if (!Number.isFinite(secPerKm) || secPerKm <= 0) return "--:--/km";
  const minutes = Math.floor(secPerKm / 60);
  const seconds = Math.round(secPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

export function startOfMonth(timestamp: number) {
  const d = new Date(timestamp);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export function addMonths(timestamp: number, delta: number) {
  const d = new Date(timestamp);
  return new Date(d.getFullYear(), d.getMonth() + delta, 1).getTime();
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/** Extracts the video ID from common YouTube URL shapes, or null if it isn't one. */
export function getYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\.|^m\.|^music\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    if (host === "youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      const match = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
      if (match) return match[1];
    }

    return null;
  } catch {
    return null;
  }
}

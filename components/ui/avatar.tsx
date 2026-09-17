import { cn } from "@/lib/utils";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({
  name,
  photoUrl,
  className,
  textClassName,
}: {
  name: string;
  photoUrl: string | null;
  className?: string;
  textClassName?: string;
}) {
  if (photoUrl) {
    return (
      // A real <img> (vs. a CSS background) loads/crops more reliably when
      // this gets captured into an exported image (share cards): html-to-image
      // clones <img> elements directly, but has known issues re-embedding
      // background-image + background-size, which can drop or distort it.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        crossOrigin="anonymous"
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn("flex items-center justify-center text-slate-950", className)}
      style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
    >
      <span className={cn("font-bold", textClassName)}>{getInitials(name)}</span>
    </div>
  );
}

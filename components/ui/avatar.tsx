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
      <div
        className={cn("bg-cover bg-center", className)}
        style={{ backgroundImage: `url(${photoUrl})` }}
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

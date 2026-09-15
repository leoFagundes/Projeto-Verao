import type { SVGProps } from "react";

import { DumbbellIcon } from "@/components/layout/nav-icons";
import type { MuscleGroup } from "@/types/workout";

/**
 * Every icon here is built only from circles, straight lines and rects —
 * no freehand bezier curves — so proportions stay crisp and predictable at
 * the small sizes these render at. Keep new icons to that same vocabulary.
 */
function base(props: SVGProps<SVGSVGElement>) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function ChestIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M6 6h12" />
      <path d="M6 6L7.5 18" />
      <path d="M18 6L16.5 18" />
      <path d="M7.5 18h9" />
      <path d="M12 6v12" />
      <path d="M8.7 10.5h6.6" />
    </svg>
  );
}

export function BackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M6 6h12" />
      <path d="M6 6L7.5 18" />
      <path d="M18 6L16.5 18" />
      <path d="M7.5 18h9" />
      <path d="M12 6v12" />
      <path d="M8 8.5L12 11L16 8.5" />
    </svg>
  );
}

export function ShoulderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="6.3" cy="7.8" r="2.3" />
      <circle cx="17.7" cy="7.8" r="2.3" />
      <path d="M8.6 6.9L12 5.6L15.4 6.9" />
      <path d="M6.3 10.1V16.5" />
      <path d="M17.7 10.1V16.5" />
    </svg>
  );
}

export function BicepsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M7 19V13.5" />
      <path d="M7 13.5L11.5 8" />
      <path d="M11.5 8L16 9.5" />
      <circle cx="7.7" cy="10.6" r="1.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TricepsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M8 8L5 9.5" />
      <path d="M8 8L12.5 10.5" />
      <path d="M12.5 10.5L16.2 15" />
      <circle cx="10.7" cy="11.4" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LegsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M7.5 5h9" />
      <path d="M7.5 5L7.8 20" />
      <path d="M16.5 5L16.2 20" />
      <path d="M12 10.5L10.3 20" />
      <path d="M12 10.5L13.7 20" />
    </svg>
  );
}

export function GlutesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M7 6.5h10" />
      <circle cx="9.6" cy="12.3" r="4" />
      <circle cx="14.4" cy="12.3" r="4" />
    </svg>
  );
}

export function CoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="8.5" y="5" width="7" height="14" rx="2.2" />
      <path d="M8.5 9.7h7" />
      <path d="M8.5 14.3h7" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function CardioIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="9.5" cy="8.7" r="3.1" />
      <circle cx="14.5" cy="8.7" r="3.1" />
      <path d="M6.6 10L12 18L17.4 10" />
      <path d="M8.3 12.5h2l1.2-2.3 1.6 4 1.2-2.3h2.4" />
    </svg>
  );
}

/** Renders the icon for a workout's category — a switch (not a looked-up component
 * reference) so the React Compiler can see each branch is a stable, named component. */
export function CategoryIcon({
  category,
  ...props
}: { category: MuscleGroup | null } & SVGProps<SVGSVGElement>) {
  switch (category) {
    case "Peito":
      return <ChestIcon {...props} />;
    case "Costas":
      return <BackIcon {...props} />;
    case "Ombro":
      return <ShoulderIcon {...props} />;
    case "Bíceps":
      return <BicepsIcon {...props} />;
    case "Tríceps":
      return <TricepsIcon {...props} />;
    case "Pernas":
      return <LegsIcon {...props} />;
    case "Glúteos":
      return <GlutesIcon {...props} />;
    case "Core":
      return <CoreIcon {...props} />;
    case "Cardio":
      return <CardioIcon {...props} />;
    default:
      return <DumbbellIcon {...props} />;
  }
}

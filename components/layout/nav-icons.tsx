import type { SVGProps } from "react";

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

export function DumbbellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M8.5 12h7" />
      <path d="M7 9v6" />
      <path d="M17 9v6" />
      <path d="M4 7v10" />
      <path d="M20 7v10" />
    </svg>
  );
}

export function RunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="14.5" cy="4.8" r="1.6" fill="currentColor" stroke="none" />
      <path d="M13 6.8L10.3 13.2" />
      <path d="M10.3 13.2L7.8 16L4.5 17" />
      <path d="M10.3 13.2L12.8 16.5L11.5 21" />
      <path d="M12.5 8L15 9.5L17 7.5" />
      <path d="M12.5 8L10 9L8.5 11.5" />
    </svg>
  );
}

export function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M5 20v-5" />
      <path d="M12 20v-9" />
      <path d="M19 20v-14" />
    </svg>
  );
}

export function ScaleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3.5" />
      <rect x="9.3" y="9" width="5.4" height="3.2" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MealIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M7 3v6" />
      <path d="M9 3v6" />
      <path d="M11 3v6" />
      <path d="M9 9v12" />
      <path d="M16 3v7" />
      <path d="M18 3l-2 7" />
      <path d="M16.5 10v11" />
    </svg>
  );
}

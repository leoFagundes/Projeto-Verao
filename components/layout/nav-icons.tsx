import type { SVGProps } from "react";

function base(props: SVGProps<SVGSVGElement>) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function DumbbellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M4 9v6" />
      <path d="M7 6v12" />
      <path d="M17 6v12" />
      <path d="M20 9v6" />
      <path d="M7 12h10" />
    </svg>
  );
}

export function RunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="13" cy="4.5" r="1.3" fill="currentColor" stroke="none" />
      <path d="M4.5 17.5l4.5 1 1-2" />
      <path d="M15 21v-4l-4-3 1-6" />
      <path d="M7 12v-3l5-1 3 3 3 1" />
    </svg>
  );
}

export function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M5 21v-6" />
      <path d="M12 21V10" />
      <path d="M19 21v-8" />
    </svg>
  );
}

export function ScaleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

"use client";

import { useId } from "react";

export function Logo({ className }: { className?: string }) {
  const gradientId = `pv-logo-${useId()}`;

  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="2" y1="2" x2="38" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="13" r="6.5" fill={`url(#${gradientId})`} />
      <g stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round">
        <line x1="20" y1="0.5" x2="20" y2="3.5" />
        <line x1="9.5" y1="5.5" x2="11.7" y2="7.7" />
        <line x1="30.5" y1="5.5" x2="28.3" y2="7.7" />
      </g>
      <path
        d="M2 28H10L14 18L19.5 34L25 16L29 28H38"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

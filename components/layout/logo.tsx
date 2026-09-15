"use client";

import { useId } from "react";

/**
 * A minimalist sun in sunglasses — "Verão" (summer), nothing else. Built
 * from a circle, 8 evenly-spaced rays and two rounded-rect lenses, all on a
 * fixed grid, so the mark stays crisp at any size.
 */
export function Logo({ className }: { className?: string }) {
  const gradientId = `pv-logo-${useId()}`;

  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="6.5" y1="6.5" x2="33.5" y2="33.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round">
        <line x1="20" y1="10" x2="20" y2="6.5" />
        <line x1="27.1" y1="12.9" x2="29.6" y2="10.5" />
        <line x1="30" y1="20" x2="33.5" y2="20" />
        <line x1="27.1" y1="27.1" x2="29.6" y2="29.6" />
        <line x1="20" y1="30" x2="20" y2="33.5" />
        <line x1="12.9" y1="27.1" x2="10.4" y2="29.6" />
        <line x1="10" y1="20" x2="6.5" y2="20" />
        <line x1="12.9" y1="12.9" x2="10.4" y2="10.4" />
      </g>
      <circle cx="20" cy="20" r="8" fill={`url(#${gradientId})`} />
      <g fill="var(--bg)">
        <rect x="12.8" y="17.1" width="5.5" height="4.4" rx="1.7" />
        <rect x="21.7" y="17.1" width="5.5" height="4.4" rx="1.7" />
      </g>
      <g stroke="var(--bg)" strokeWidth="1.9" strokeLinecap="round">
        <line x1="18.3" y1="19.3" x2="21.7" y2="19.3" />
        <line x1="12.8" y1="18.2" x2="10.2" y2="17" />
        <line x1="27.2" y1="18.2" x2="29.8" y2="17" />
      </g>
    </svg>
  );
}

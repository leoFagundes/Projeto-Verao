"use client";

import { useId } from "react";

/**
 * A minimalist sun in sunglasses — "Verão" (summer), nothing else. Same mark
 * as the app icon/favicon (app/icon.svg), redrawn with theme CSS variables
 * instead of fixed colors so it follows each profile's accent, and without
 * the favicon's opaque background square since it sits on the header itself.
 */
export function Logo({ className }: { className?: string }) {
  const gradientId = `pv-logo-${useId()}`;

  return (
    <div>
      <svg
        viewBox="0 0 40 40"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="8"
            y1="8"
            x2="32"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <g fill={`url(#${gradientId})`}>
          <polygon points="18.3,11.7 20,6 21.7,11.7" />
          <polygon points="24.95,13.21 28.49,11.52 26.79,15.05" />
          <polygon points="28.3,18.3 34,20 28.3,21.7" />
          <polygon points="26.79,24.95 28.49,28.49 24.95,26.79" />
          <polygon points="21.7,28.3 20,34 18.3,28.3" />
          <polygon points="15.05,26.79 11.52,28.49 13.21,24.95" />
          <polygon points="11.7,21.7 6,20 11.7,18.3" />
          <polygon points="13.21,15.05 11.52,11.52 15.05,13.21" />
        </g>
        <circle cx="20" cy="20" r="8" fill={`url(#${gradientId})`} />
        <circle
          cx="20"
          cy="20"
          r="7.7"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="0.6"
          opacity="0.3"
        />
        <rect
          x="18.6"
          y="18.9"
          width="2.8"
          height="1.4"
          rx="0.7"
          fill="var(--bg)"
        />
        <circle cx="15.6" cy="19.6" r="3.3" fill="var(--bg)" />
        <circle cx="24.4" cy="19.6" r="3.3" fill="var(--bg)" />
        <circle cx="14.5" cy="18.3" r="0.6" fill="#ffffff" opacity="0.5" />
        <circle cx="23.3" cy="18.3" r="0.6" fill="#ffffff" opacity="0.5" />
      </svg>
    </div>
  );
}

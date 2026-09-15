import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS applies its own corner mask, so this background stays a sharp square —
// a baked-in radius here would just create a double-rounded, inset look.
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
  <rect width="40" height="40" fill="#101019" />
  <defs>
    <linearGradient id="g" x1="2" y1="2" x2="38" y2="36" gradientUnits="userSpaceOnUse">
      <stop stop-color="#818cf8" />
      <stop offset="1" stop-color="#38bdf8" />
    </linearGradient>
  </defs>
  <g transform="translate(20 20) scale(0.82) translate(-20 -20)">
    <circle cx="20" cy="13" r="6.5" fill="url(#g)" />
    <g stroke="url(#g)" stroke-width="2.2" stroke-linecap="round">
      <line x1="20" y1="0.5" x2="20" y2="3.5" />
      <line x1="9.5" y1="5.5" x2="11.7" y2="7.7" />
      <line x1="30.5" y1="5.5" x2="28.3" y2="7.7" />
    </g>
    <path d="M2 28H10L14 18L19.5 34L25 16L29 28H38" stroke="url(#g)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  </g>
</svg>`;

const dataUri = `data:image/svg+xml;base64,${Buffer.from(markSvg).toString("base64")}`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUri} width={size.width} height={size.height} alt="" />
      </div>
    ),
    { ...size },
  );
}

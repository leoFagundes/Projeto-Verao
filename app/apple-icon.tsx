import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS applies its own corner mask, so this background stays a sharp square —
// a baked-in radius here would just create a double-rounded, inset look.
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
  <rect width="40" height="40" fill="#101019" />
  <defs>
    <linearGradient id="g" x1="6.5" y1="6.5" x2="33.5" y2="33.5" gradientUnits="userSpaceOnUse">
      <stop stop-color="#818cf8" />
      <stop offset="1" stop-color="#38bdf8" />
    </linearGradient>
  </defs>
  <g stroke="url(#g)" stroke-width="2" stroke-linecap="round">
    <line x1="20" y1="10" x2="20" y2="6.5" />
    <line x1="27.1" y1="12.9" x2="29.6" y2="10.5" />
    <line x1="30" y1="20" x2="33.5" y2="20" />
    <line x1="27.1" y1="27.1" x2="29.6" y2="29.6" />
    <line x1="20" y1="30" x2="20" y2="33.5" />
    <line x1="12.9" y1="27.1" x2="10.4" y2="29.6" />
    <line x1="10" y1="20" x2="6.5" y2="20" />
    <line x1="12.9" y1="12.9" x2="10.4" y2="10.4" />
  </g>
  <circle cx="20" cy="20" r="8" fill="url(#g)" />
  <g fill="#101019">
    <rect x="12.8" y="17.1" width="5.5" height="4.4" rx="1.7" />
    <rect x="21.7" y="17.1" width="5.5" height="4.4" rx="1.7" />
  </g>
  <g stroke="#101019" stroke-width="1.9" stroke-linecap="round">
    <line x1="18.3" y1="19.3" x2="21.7" y2="19.3" />
    <line x1="12.8" y1="18.2" x2="10.2" y2="17" />
    <line x1="27.2" y1="18.2" x2="29.8" y2="17" />
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

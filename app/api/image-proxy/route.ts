import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_HOSTNAME = "firebasestorage.googleapis.com";

/**
 * Same-origin passthrough for our own Firebase Storage photos. Our bucket
 * has no CORS config (breaks plain <img> display if we ever set
 * `crossOrigin`, see components/ui/avatar.tsx) — which also means a
 * canvas-export library like html-to-image can't fetch-and-inline those
 * photos to produce a downloadable PNG; the resulting canvas gets tainted
 * and export throws. Routing the photo through our own domain first makes
 * it same-origin from the browser's point of view, sidestepping that
 * entirely. Locked to our own Storage host so this can't be used as an
 * open proxy for arbitrary URLs.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Parâmetro url ausente." }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "URL inválida." }, { status: 400 });
  }
  if (parsed.hostname !== ALLOWED_HOSTNAME) {
    return NextResponse.json({ error: "Host não permitido." }, { status: 403 });
  }

  const upstream = await fetch(parsed.toString());
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Não foi possível buscar a imagem." }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

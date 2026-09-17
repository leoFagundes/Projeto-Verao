/** iPhones default to HEIC/HEIF, which most browsers (everything but Safari)
 * can't decode in an <img> or <canvas> — this is the most common reason an
 * uploaded photo silently "doesn't load" afterwards. */
export function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    file.type === "image/heic" ||
    file.type === "image/heif"
  );
}

/** Converts a HEIC/HEIF file to a JPEG blob client-side (via a WASM decoder,
 * loaded on demand — most files never need this, so it shouldn't cost
 * everyone the bundle size). */
export async function convertHeicToJpegBlob(file: File): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  return Array.isArray(result) ? result[0] : result;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
    image.src = src;
  });
}

/** Draws the selected crop rectangle onto a canvas and exports it as a JPEG,
 * capped at `maxOutputSize` — guarantees a universally-renderable format and
 * a reasonably small upload regardless of the source photo's size/format. */
export async function getCroppedImageBlob(
  imageSrc: string,
  cropPixels: { x: number; y: number; width: number; height: number },
  maxOutputSize = 1024,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const outputSize = Math.min(maxOutputSize, Math.max(cropPixels.width, cropPixels.height));

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado neste navegador.");

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao processar a imagem."))),
      "image/jpeg",
      0.9,
    );
  });
}

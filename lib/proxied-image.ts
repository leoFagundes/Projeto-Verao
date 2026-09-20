/** Same-origin passthrough (see app/api/image-proxy/route.ts) for our own
 * Firebase Storage photos — needed wherever a photo gets captured into a
 * canvas (html-to-image, etc.), since the Storage bucket has no CORS config
 * and a canvas built straight from those URLs ends up tainted and unusable. */
export function proxiedImageSrc(url: string) {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

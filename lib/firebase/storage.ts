import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { generateId } from "@/lib/utils";

import { storage } from "./client";

export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!storage) {
    throw new Error(
      "Firebase Storage não está configurado. Configure as variáveis de ambiente do Firebase.",
    );
  }

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${generateId()}.${extension}`;
  const fileRef = ref(storage, path);
  const snapshot = await uploadBytes(fileRef, file);
  return getDownloadURL(snapshot.ref);
}

/**
 * Extracts our own Storage object path (e.g. "profiles/abc123.jpg") out of
 * one of our own download URLs. Building a ref from this relative path
 * instead of handing the SDK the full URL avoids a subtle failure mode:
 * `ref(storage, url)` requires the URL's bucket host to string-match the
 * currently configured bucket exactly, which silently throws (caught below
 * and effectively ignored) if that ever drifts — e.g. the env var bucket
 * name gets updated but older stored URLs still encode the previous one.
 */
function pathFromOwnedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("firebasestorage")) return null;
    const match = parsed.pathname.match(/\/o\/(.+)$/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/**
 * Deletes a file from our Storage bucket if `url` actually points there.
 * No-ops for pasted external links (not ours to delete) — image cleanup is
 * best-effort and must never block the Firestore write it accompanies, but
 * a genuine failure (permissions, etc.) is logged instead of hidden, so it
 * doesn't fail silently forever.
 */
export async function deleteImageIfOwned(url: string | null | undefined) {
  if (!url || !storage) return;

  const path = pathFromOwnedUrl(url);
  if (!path) return;

  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    if ((error as { code?: string } | null)?.code !== "storage/object-not-found") {
      console.error("Não foi possível apagar o arquivo do Storage:", path, error);
    }
  }
}

/** Convenience for cleaning up several possibly-owned URLs at once. */
export async function deleteImagesIfOwned(urls: Array<string | null | undefined>) {
  await Promise.all(urls.map((url) => deleteImageIfOwned(url)));
}

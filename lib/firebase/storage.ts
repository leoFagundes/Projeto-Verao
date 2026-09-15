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
 * Deletes a file from our Storage bucket if `url` actually points there.
 * No-ops for pasted external links (not ours to delete) and for files that
 * are already gone — image cleanup is best-effort and must never block the
 * Firestore write it accompanies.
 */
export async function deleteImageIfOwned(url: string | null | undefined) {
  if (!url || !storage) return;

  try {
    await deleteObject(ref(storage, url));
  } catch {
    // Either an external URL that doesn't belong to this bucket, or the
    // object was already removed — both are fine to ignore.
  }
}

/** Convenience for cleaning up several possibly-owned URLs at once. */
export async function deleteImagesIfOwned(urls: Array<string | null | undefined>) {
  await Promise.all(urls.map((url) => deleteImageIfOwned(url)));
}

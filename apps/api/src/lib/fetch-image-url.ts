import { imageExtFromContentType } from "@/lib/s3/storage";

export class ImageFetchError extends Error {}

/** Block loopback, link-local and RFC-1918 ranges to prevent SSRF. */
function isPrivateHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "::1") return true;
  if (/^127\./.test(hostname)) return true;
  if (/^169\.254\./.test(hostname)) return true;
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(?:1[6-9]|2\d|3[01])\./.test(hostname)) return true;
  return false;
}

export type FetchImageResult = {
  bytes: Uint8Array;
  contentType: string;
  ext: string;
};

/**
 * Fetch an image from a remote URL, validate it, and return raw bytes.
 * Blocks private network hosts. Enforces a size cap and content-type allowlist.
 */
export async function fetchImageFromUrl(
  rawUrl: string,
  opts: { maxBytes?: number; allowedTypes?: string[] } = {},
): Promise<FetchImageResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ImageFetchError("URL invalide");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ImageFetchError("Seules les URL http/https sont acceptées");
  }

  if (isPrivateHost(url.hostname)) {
    throw new ImageFetchError("L'URL pointe vers un réseau privé");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  let res: Response;
  try {
    res = await fetch(rawUrl, { signal: controller.signal, redirect: "follow" });
  } catch {
    throw new ImageFetchError("Impossible de récupérer l'image depuis cette URL");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new ImageFetchError(`Le serveur distant a répondu ${res.status}`);
  }

  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  const ext = imageExtFromContentType(contentType);
  const allowed = opts.allowedTypes ?? ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];

  if (!ext || !allowed.includes(contentType)) {
    throw new ImageFetchError(`Type d'image non supporté : ${contentType || "inconnu"}`);
  }

  const maxBytes = opts.maxBytes ?? 5 * 1024 * 1024;
  const reader = res.body?.getReader();
  if (!reader) throw new ImageFetchError("Réponse vide");

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      reader.cancel().catch(() => {});
      throw new ImageFetchError("L'image dépasse la taille maximale autorisée");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  return { bytes, contentType, ext };
}

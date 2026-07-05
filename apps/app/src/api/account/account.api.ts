import { ENV } from "varlock/env";

import { ApiError } from "@/lib/http";

/**
 * Builds the URL serving the authenticated user's profile photo. `version`
 * (e.g. the user's `updatedAt`) busts the browser cache when the photo is
 * replaced. Returns `null` when the user has no avatar.
 */
export function userAvatarUrl(avatar: string | null | undefined, version?: string | number): string | null {
  if (!avatar) return null;
  const base = String(ENV.VITE_API_URL).replace(/\/$/, "");
  const v = version ? `?v=${encodeURIComponent(String(version))}` : "";
  return `${base}/auth/avatar${v}`;
}

/**
 * Uploads (or replaces) the authenticated user's profile photo via multipart
 * form data. Uses a raw `fetch` (with cookie credentials) because the multipart
 * route is not typed on the RPC client.
 */
export async function uploadAvatar(file: File) {
  const base = String(ENV.VITE_API_URL).replace(/\/$/, "");
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${base}/auth/avatar`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) throw await ApiError.fromResponse(res);

  return res.json() as Promise<{ success: boolean }>;
}

/**
 * Fetches a remote image URL server-side and stores it as the user's avatar.
 */
export async function uploadAvatarFromUrl(url: string) {
  const base = String(ENV.VITE_API_URL).replace(/\/$/, "");
  const res = await fetch(`${base}/auth/avatar`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json() as Promise<{ success: boolean }>;
}

/** Removes the authenticated user's profile photo. */
export async function deleteAvatar() {
  const base = String(ENV.VITE_API_URL).replace(/\/$/, "");
  const res = await fetch(`${base}/auth/avatar`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) throw await ApiError.fromResponse(res);

  return res.json() as Promise<{ success: boolean }>;
}

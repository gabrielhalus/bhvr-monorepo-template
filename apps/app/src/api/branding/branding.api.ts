import { ENV } from "varlock/env";

import { ApiError } from "@/lib/http";

function apiBase() {
  return String(ENV.VITE_API_URL).replace(/\/$/, "");
}

/** Builds the URL that serves the branding logo (no auth, cache-busted by version). */
export function brandingLogoUrl(version?: string | number): string {
  const v = version ? `?v=${encodeURIComponent(String(version))}` : "";
  return `${apiBase()}/branding/logo${v}`;
}

/** Builds the URL that serves the branding favicon (no auth, cache-busted by version). */
export function brandingFaviconUrl(version?: string | number): string {
  const v = version ? `?v=${encodeURIComponent(String(version))}` : "";
  return `${apiBase()}/branding/favicon${v}`;
}

async function uploadBrandingAsset(path: string, file: File): Promise<{ success: boolean; key: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json();
}

async function uploadBrandingAssetFromUrl(path: string, url: string): Promise<{ success: boolean; key: string }> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json();
}

async function deleteBrandingAsset(path: string): Promise<{ success: boolean }> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json();
}

export const uploadBrandingLogo = (file: File) => uploadBrandingAsset("/branding/logo", file);
export const uploadBrandingLogoFromUrl = (url: string) => uploadBrandingAssetFromUrl("/branding/logo", url);
export const deleteBrandingLogo = () => deleteBrandingAsset("/branding/logo");

export const uploadBrandingFavicon = (file: File) => uploadBrandingAsset("/branding/favicon", file);
export const uploadBrandingFaviconFromUrl = (url: string) => uploadBrandingAssetFromUrl("/branding/favicon", url);
export const deleteBrandingFavicon = () => deleteBrandingAsset("/branding/favicon");

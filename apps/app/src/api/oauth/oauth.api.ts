import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";

import { ENV } from "varlock/env";

import { api, ApiError } from "@/lib/http";

export async function fetchOAuthProviders() {
  const res = await api.auth.oauth.providers.$get();

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}

export async function fetchLinkedAccounts() {
  const res = await api.auth.oauth.accounts.$get();

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}

export async function fetchPendingLink(token: string) {
  const res = await api.auth.oauth["pending-link"].$get({ query: { token } });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}

export async function completePendingLink(data: { token: string; password: string }) {
  const res = await api.auth.oauth["pending-link"].complete.$post({ json: data });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}

export async function unlinkAccount(provider: OAuthProviderId) {
  const res = await api.auth.oauth.accounts[":provider"].$delete({ param: { provider } });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}

/**
 * Build the URL that starts the OAuth flow. Starting the flow is a full
 * browser navigation (the API answers with a 302 to the provider), not a
 * fetch — use `window.location.assign(oauthStartUrl(...))`.
 */
export function oauthStartUrl(provider: OAuthProviderId, opts?: { redirect?: string; linkToken?: string }) {
  // VITE_API_URL is a relative path in dev (Vite proxy) — resolve it against
  // the page origin; an absolute URL ignores the base.
  const url = new URL(`${ENV.VITE_API_URL}/auth/oauth/${provider}`, window.location.origin);

  if (opts?.redirect) {
    url.searchParams.set("redirect", opts.redirect);
  }
  if (opts?.linkToken) {
    url.searchParams.set("linkToken", opts.linkToken);
  }

  return url.toString();
}

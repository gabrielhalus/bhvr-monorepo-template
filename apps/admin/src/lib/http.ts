import type { AdminAppType } from "~api/app";

import { ENV } from "varlock/env";

import { ApiError, createApiClient } from "~app-core/index";

/** Typed client for the /admin surface only — keeps hc<> inference small. */
const adminApi = createApiClient<AdminAppType>(ENV.VITE_API_URL);

/**
 * Auth endpoints live on the shared surface (/auth). The admin app talks to
 * them with plain fetches to avoid pulling the whole tenant AppType into
 * its type graph.
 */
async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${ENV.VITE_API_URL}/auth${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

export { adminApi, ApiError, authFetch };

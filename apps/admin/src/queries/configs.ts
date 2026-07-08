import type { Config } from "~shared/types/db/configs.types";

import { queryOptions } from "@tanstack/react-query";
import { ENV } from "varlock/env";

import { ApiError, QUERY_STALE_TIMES } from "~app-core/index";

/**
 * Platform configs travel over the shared /config surface (orgContext is null
 * on the admin domain, so the API resolves platform values). Plain fetches —
 * pulling the tenant AppType into the admin type graph isn't worth it.
 */
async function configFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${ENV.VITE_API_URL}/config${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

export const configsQueryOptions = queryOptions({
  queryKey: ["admin", "configs"],
  queryFn: async (): Promise<Config[]> => {
    const res = await configFetch("");
    if (!res.ok) throw await ApiError.fromResponse(res);
    const body = await res.json();
    return body.configs as Config[];
  },
  staleTime: QUERY_STALE_TIMES.RUNTIME_CONFIG,
});

export async function updateConfig(key: string, value: string | null): Promise<void> {
  const res = await configFetch(`/${key}`, { method: "PUT", body: JSON.stringify({ value }) });
  if (!res.ok) throw await ApiError.fromResponse(res);
}

export async function rotateConfig(key: string): Promise<void> {
  const res = await configFetch(`/${key}/rotate`, { method: "POST" });
  if (!res.ok) throw await ApiError.fromResponse(res);
}

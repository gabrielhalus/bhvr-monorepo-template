import type { Session } from "~shared/types/auth.types";
import type { Permission } from "~shared/types/permissions.types";
import type { InferResponseType } from "hono";

import { queryOptions } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/http";

export const setupStatusQueryOptions = queryOptions({
  queryKey: ["auth", "setup"],
  queryFn: async (): Promise<{ needsSetup: boolean }> => {
    const res = await api.auth.setup.$get();

    if (!res.ok) {
      // A 429 means the request was rate limited, not that setup is done —
      // surface it so bootstrap can react instead of silently guessing.
      if (res.status === 429) throw await ApiError.fromResponse(res);
      return { needsSetup: false };
    }

    const { needsSetup } = await res.json();
    return { needsSetup };
  },
  staleTime: 60 * 1000,
  retry: false,
});

export const authQueryOptions = queryOptions({
  queryKey: ["auth"],
  queryFn: async (): Promise<Session | null> => {
    const res = await api.auth.$get();

    if (!res.ok) {
      // A 429 means the session couldn't be retrieved because we're rate
      // limited — not that the visitor is signed out. Throw so callers don't
      // mistake it for an anonymous session and bounce to /login (which would
      // hit the same wall), and let the error boundary show a recoverable
      // screen instead.
      if (res.status === 429) throw await ApiError.fromResponse(res);
      return null;
    }

    const data = await res.json() as InferResponseType<typeof api.auth.$get>;

    return {
      user: data.user,
      authenticated: true,
      ...(data.impersonator && { impersonator: data.impersonator }),
    };
  },
  staleTime: Infinity,
  retry: false,
});

export function authorizeQueryOptions(permission: Permission, resource?: Record<string, unknown>) {
  return queryOptions({
    queryKey: ["authorize", { permission, resource }],
    queryFn: async (): Promise<boolean> => {
      const res = await api.auth.authorize.$post({ json: { checks: [{ permission, resource }] } });

      if (!res.ok) {
        return false;
      }

      const { results } = await res.json();
      return results[0] ?? false;
    },
    staleTime: Infinity,
    retry: false,
  });
}

export function authorizeBatchQueryOptions(checks: Array<{ permission: Permission; resource?: Record<string, unknown> }>) {
  return queryOptions({
    queryKey: ["authorize-batch", checks],
    queryFn: async (): Promise<boolean[]> => {
      const res = await api.auth.authorize.$post({ json: { checks } });

      if (!res.ok) {
        return checks.map(() => false);
      }

      const { results } = await res.json();
      return results;
    },
    staleTime: Infinity,
    retry: false,
    enabled: checks.length > 0,
  });
}

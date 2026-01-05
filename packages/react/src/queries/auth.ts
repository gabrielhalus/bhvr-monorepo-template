import type { Session } from "~shared/types/auth.types";
import type { Permission } from "~shared/types/permissions.types";
import type { InferResponseType } from "hono";

import { queryOptions } from "@tanstack/react-query";

import { api } from "~react/lib/http";

export const authQueryOptions = queryOptions({
  queryKey: ["auth"],
  queryFn: async (): Promise<Session | null> => {
    const res = await api.auth.$get();

    if (!res.ok) {
      return null;
    }

    const { user } = await res.json() as InferResponseType<typeof api.auth.$get>;

    return {
      user,
      authenticated: true,
    };
  },
  staleTime: Infinity,
  retry: false,
});

export function authorizeQueryOptions(permission: Permission, resource?: Record<string, unknown>) {
  return queryOptions({
    queryKey: ["authorize", permission, resource],
    queryFn: async (): Promise<boolean> => {
      const res = await api.auth.authorize.$post({ json: { permission, resource } });

      if (!res.ok) {
        return false;
      }

      const { authorize } = await res.json();
      return authorize;
    },
    staleTime: Infinity,
    retry: false,
  });
}

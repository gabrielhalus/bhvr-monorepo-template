import type { Session } from "~shared/types/auth.types";

import { queryOptions } from "@tanstack/react-query";

import { authFetch } from "@/lib/http";
import { QUERY_STALE_TIMES } from "~app-core/index";

export const authQueryOptions = queryOptions({
  queryKey: ["auth"],
  queryFn: async (): Promise<Session | null> => {
    const res = await authFetch("");
    if (!res.ok) return null;
    const body = await res.json();
    if (!body?.success) return null;
    return { user: body.user, authenticated: true, impersonator: body.impersonator } as Session;
  },
  staleTime: QUERY_STALE_TIMES.AUTH,
  retry: false,
});

export async function login(email: string, password: string): Promise<boolean> {
  const res = await authFetch("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return false;
  const body = await res.json();
  return !!body?.success;
}

export async function logout(): Promise<void> {
  await authFetch("/logout", { method: "POST" });
}

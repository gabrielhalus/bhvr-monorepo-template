import type { QueryClient, UseQueryOptions } from "@tanstack/react-query";
import type { Session } from "~shared/types/auth.types";

import { redirect } from "@tanstack/react-router";

export type AuthDeps = {
  queryClient: QueryClient;
  authQueryOptions: Pick<UseQueryOptions<Session | null>, "queryKey" | "queryFn" | "staleTime">;
  getCurrentUrl?: () => string;
  getOrigin?: () => string;
};

export type AuthOptionsBase = {
  /** Redirect when unauthenticated (default: true) */
  redirectOnUnauthenticated?: boolean;
};

/** Variant: redirect when authenticated → never returns */
export type AuthOptionsRedirectAuthenticated = {
  redirectOnAuthenticated: boolean;
} & AuthOptionsBase;

/** Variant: doesn't redirect when authenticated → returns Session | null */
export type AuthOptionsNoRedirectOnAuthenticated = {
  redirectOnAuthenticated?: false;
} & AuthOptionsBase;

/** Union for function overloads */
export type AuthOptions = AuthOptionsNoRedirectOnAuthenticated | AuthOptionsRedirectAuthenticated;

/**
 * Factory for the `auth()` route guard.
 * Injects app-specific dependencies (queryClient, session query, env).
 */
export function createAuth({
  queryClient,
  authQueryOptions,
  getCurrentUrl = () => window.location.href,
  getOrigin = () => window.location.origin,
}: AuthDeps) {
  // --- Overloads for proper type inference ---
  async function auth(options?: AuthOptionsNoRedirectOnAuthenticated): Promise<Session | null>;
  async function auth(options: AuthOptionsRedirectAuthenticated): Promise<never>;
  async function auth(options?: AuthOptions): Promise<Session | null | never> {
    const {
      redirectOnUnauthenticated = true,
      redirectOnAuthenticated = false,
    } = options ?? {};

    const currentUrl = getCurrentUrl();
    const origin = getOrigin();

    const session = await queryClient.ensureQueryData(authQueryOptions as Parameters<QueryClient["ensureQueryData"]>[0]) as Session | null;

    if (session) {
      if (redirectOnAuthenticated && currentUrl !== origin) {
        throw redirect({ href: origin, replace: true });
      }
      return session;
    }

    if (redirectOnUnauthenticated && currentUrl !== origin) {
      const authUrl = `${origin}/login?redirect=${encodeURIComponent(currentUrl)}`;
      throw redirect({ href: authUrl, replace: true });
    }

    return null;
  }

  return auth;
}

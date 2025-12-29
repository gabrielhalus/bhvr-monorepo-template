import type { Session } from "@bunstack/shared/types/auth.types";

import { redirect } from "@tanstack/react-router";

import { env } from "../lib/env";
import { authQueryOptions } from "../queries/auth";
import { queryClient } from "./query-client";

export type AuthDeps = {
  getCurrentUrl?: () => string;
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
 * Factory for the `auth()` helper.
 * Injects app-specific dependencies (queryClient, env, etc.)
 */
export function createAuth({
  getCurrentUrl = () => window.location.href,
}: AuthDeps = {}) {
  // --- Overloads for proper type inference ---
  async function auth(options?: AuthOptionsNoRedirectOnAuthenticated): Promise<Session | null>;
  async function auth(options: AuthOptionsRedirectAuthenticated): Promise<never>;
  async function auth(options?: AuthOptions): Promise<Session | null | never> {
    const {
      redirectOnUnauthenticated = true,
      redirectOnAuthenticated = false,
    } = options ?? {};

    const currentUrl = getCurrentUrl();

    const session = await queryClient.ensureQueryData(authQueryOptions);

    if (session) {
      if (redirectOnAuthenticated && currentUrl !== env.VITE_SITE_URL) {
        throw redirect({ href: env.VITE_SITE_URL, replace: true });
      }
      return session;
    }

    if (redirectOnUnauthenticated && currentUrl !== env.VITE_AUTH_URL) {
      const authUrl = `${env.VITE_AUTH_URL}/login?redirect=${encodeURIComponent(currentUrl)}`;
      throw redirect({ href: authUrl, replace: true });
    }

    return null;
  }

  return auth;
}

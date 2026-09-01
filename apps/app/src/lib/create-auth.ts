import type { Session } from "~shared/types/auth.types";

import { redirect } from "@tanstack/react-router";

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

    // Path-only throughout: the app has no configured URL, and the API rejects
    // an absolute `redirect` value as a potential open redirect — passing one
    // would silently drop the destination after an OAuth round trip.
    const { pathname, search } = new URL(getCurrentUrl());
    const currentPath = `${pathname}${search}`;

    const session = await queryClient.ensureQueryData(authQueryOptions);

    if (session) {
      if (redirectOnAuthenticated && pathname !== "/") {
        throw redirect({ to: "/", replace: true });
      }
      return session;
    }

    if (redirectOnUnauthenticated && pathname !== "/login") {
      throw redirect({ to: "/login", search: { redirect: currentPath }, replace: true });
    }

    return null;
  }

  return auth;
}

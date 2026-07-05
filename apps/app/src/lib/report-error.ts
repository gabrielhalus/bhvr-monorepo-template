import { ApiError } from "./http";

/** Routes that must never trigger an auth redirect (avoids redirect loops). */
const PUBLIC_PATH_PREFIXES = ["/login", "/register", "/accept-invitation", "/r/"];

let isRedirecting = false;

/**
 * Maps an error to a user-facing i18n key. This module is design-agnostic and
 * has no direct access to the app's i18n instance — instead the app injects a
 * translator via {@link setErrorTranslator} at bootstrap.
 */
type Translator = (key: string) => string;

let translate: Translator = key => key;

/** Registers the app's translator so centralized handlers can localize errors. */
export function setErrorTranslator(fn: Translator): void {
  translate = fn;
}

/** HTTP status → generic i18n key. Used as a fallback when no contextual message exists. */
function errorKey(error: unknown): string {
  if (!(error instanceof ApiError)) return "errors.api.server";

  switch (error.status) {
    case 400:
    case 422:
      return "errors.api.validation";
    case 403:
      return "errors.api.forbidden";
    case 404:
      return "errors.api.notFound";
    case 408:
    case 429:
      return "errors.api.rateLimited";
    default:
      return error.status >= 500 ? "errors.api.server" : "errors.api.fallback";
  }
}

/** Localized, user-facing message for any error (generic, status-based). */
export function apiErrorMessage(error: unknown): string {
  return translate(errorKey(error));
}

/**
 * Single funnel for every query/mutation failure, called by the global query
 * and mutation caches. Owns the cross-cutting reactions that must happen no
 * matter which screen triggered the request.
 *
 * @returns `true` when the error was fully handled here (e.g. a `401` triggered
 * a redirect), so callers can skip showing their own UI for it.
 */
export function reportError(error: unknown, context?: { source?: "query" | "mutation" }): boolean {
  if (error instanceof ApiError && error.status === 401) {
    redirectToLogin();
    return true;
  }

  const label = context?.source ? `[api:${context.source}]` : "[api]";
  console.error(label, error);
  return false;
}

function redirectToLogin(): void {
  if (typeof window === "undefined" || isRedirecting) return;

  const { pathname } = window.location;
  if (PUBLIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))) return;

  isRedirecting = true;
  window.location.assign("/login");
}

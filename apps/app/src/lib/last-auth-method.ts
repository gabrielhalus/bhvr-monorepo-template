import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";

import { OAUTH_PROVIDER_IDS } from "~shared/schemas/api/oauth.schemas";

export type AuthMethod = "password" | OAuthProviderId;

const KEY = "lastAuthMethod";
const PREVIOUS_KEY = "lastAuthMethod.previous";

function isAuthMethod(value: string | null): value is AuthMethod {
  return value === "password" || (OAUTH_PROVIDER_IDS as readonly string[]).includes(value ?? "");
}

/**
 * The sign-in method last used successfully in this browser, used to hint the
 * visitor on the login screen. Stored in localStorage — per browser on purpose.
 */
export function getLastAuthMethod(): AuthMethod | null {
  try {
    const value = localStorage.getItem(KEY);
    return isAuthMethod(value) ? value : null;
  } catch {
    return null;
  }
}

/** Record a confirmed successful sign-in with the given method. */
export function setLastAuthMethod(method: AuthMethod) {
  try {
    localStorage.setItem(KEY, method);
    localStorage.removeItem(PREVIOUS_KEY);
  } catch {
    // localStorage unavailable (private mode) — the hint is best-effort
  }
}

/**
 * Record a method before leaving for the OAuth provider, keeping the previous
 * value so a failed flow can be rolled back with `rollbackAuthMethod`.
 */
export function setOptimisticAuthMethod(method: AuthMethod) {
  try {
    localStorage.setItem(PREVIOUS_KEY, localStorage.getItem(KEY) ?? "");
    localStorage.setItem(KEY, method);
  } catch {
    // localStorage unavailable — nothing to roll back later either
  }
}

/** Restore the value saved by `setOptimisticAuthMethod` after a failed flow. */
export function rollbackAuthMethod() {
  try {
    const previous = localStorage.getItem(PREVIOUS_KEY);
    if (previous === null) return;

    if (isAuthMethod(previous)) {
      localStorage.setItem(KEY, previous);
    } else {
      localStorage.removeItem(KEY);
    }
    localStorage.removeItem(PREVIOUS_KEY);
  } catch {
    // localStorage unavailable
  }
}

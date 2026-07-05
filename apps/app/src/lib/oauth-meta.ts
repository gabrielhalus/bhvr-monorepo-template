import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";
import type { ComponentType } from "react";

import { Github, Google, KeyRound } from "~orbit/components/ui/icons";

/** Static provider metadata; the label is a fallback — the server payload wins. */
export const OAUTH_PROVIDER_META: Record<OAuthProviderId, { label: string; icon: ComponentType<{ className?: string }> }> = {
  google: { label: "Google", icon: Google },
  github: { label: "GitHub", icon: Github },
  sso: { label: "SSO", icon: KeyRound },
};

/** Error codes the OAuth callback may append to the redirect URL. */
export const OAUTH_ERROR_CODES: string[] = [
  "oauth_failed",
  "registration_disabled",
  "email_missing",
  "email_unverified",
  "account_taken",
  "provider_already_linked",
  "invalid_token",
  "confirm_failed",
];

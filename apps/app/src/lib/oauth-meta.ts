import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";
import type { ComponentType } from "react";

import { Github, Google, KeyRound, ShieldCheck } from "~orbit/components/ui/icons";

/** Static provider metadata; the label is a fallback — the server payload wins. */
export const OAUTH_PROVIDER_META: Record<OAuthProviderId, { label: string; icon: ComponentType<{ className?: string }> }> = {
  google: { label: "Google", icon: Google },
  github: { label: "GitHub", icon: Github },
  sso: { label: "SSO", icon: KeyRound },
  saml: { label: "SAML", icon: ShieldCheck },
};

/** Error codes the OAuth and SAML callbacks may append to the redirect URL. */
export const OAUTH_ERROR_CODES: string[] = [
  "oauth_failed",
  "registration_disabled",
  "email_missing",
  "email_unverified",
  "account_taken",
  "provider_already_linked",
  "invalid_token",
  "confirm_failed",
  "saml_failed",
  "saml_invalid_signature",
  "saml_assertion_expired",
  "saml_audience_mismatch",
  "saml_replay",
];

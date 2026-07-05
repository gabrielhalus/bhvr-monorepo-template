import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";

import { useTranslation } from "react-i18next";

import { oauthStartUrl } from "@/api/oauth/oauth.api";
import { useOAuthProviders } from "@/hooks/oauth/use-oauth-providers";
import { getLastAuthMethod, setOptimisticAuthMethod } from "@/lib/last-auth-method";
import { Badge } from "~orbit/components/ui/Badge";
import { Button } from "~orbit/components/ui/Button";
import { Github, Google, KeyRound } from "~orbit/components/ui/icons";

/** Static provider metadata; the label is a fallback — the server payload wins. */
export const OAUTH_PROVIDER_META: Record<OAuthProviderId, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
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

type OAuthButtonsProps = {
  redirectTo?: string;
};

export function OAuthButtons({ redirectTo }: OAuthButtonsProps) {
  const { t } = useTranslation("auth");

  const { data } = useOAuthProviders();
  const providers = data?.providers ?? [];
  const lastMethod = getLastAuthMethod();

  if (providers.length === 0) {
    return null;
  }

  const handleStart = (provider: OAuthProviderId) => {
    setOptimisticAuthMethod(provider);
    window.location.assign(oauthStartUrl(provider, { redirect: redirectTo }));
  };

  return (
    <div data-slot="oauth-buttons" className="flex flex-col gap-3">
      {providers.map((provider) => {
        const Icon = OAUTH_PROVIDER_META[provider.id].icon;

        return (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleStart(provider.id)}
          >
            <Icon className="size-4" />
            {t("oauth.continueWith", { provider: provider.label })}
            {lastMethod === provider.id && (
              <Badge tone="accent" className="absolute -right-2 -top-2 ring-2 ring-paper">{t("login.lastUsed")}</Badge>
            )}
          </Button>
        );
      })}
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        {t("oauth.divider")}
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}

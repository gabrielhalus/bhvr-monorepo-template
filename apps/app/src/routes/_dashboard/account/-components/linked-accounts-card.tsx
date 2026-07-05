import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";

import { useTranslation } from "react-i18next";

import { oauthStartUrl } from "@/api/oauth/oauth.api";
import { FormSection } from "@/components/form-kit";
import { OAUTH_PROVIDER_META } from "@/components/oauth-buttons";
import { useLinkedAccounts } from "@/hooks/oauth/use-linked-accounts";
import { useOAuthProviders } from "@/hooks/oauth/use-oauth-providers";
import { useUnlinkAccount } from "@/hooks/oauth/use-unlink-account";
import sayno from "@/lib/sayno";
import { Badge } from "~orbit/components/ui/Badge";
import { Button } from "~orbit/components/ui/Button";
import { Link as LinkIcon, Loader2 } from "~orbit/components/ui/icons";

export function LinkedAccountsCard() {
  const { t } = useTranslation("web");

  const providersQuery = useOAuthProviders();
  const accountsQuery = useLinkedAccounts();
  const unlinkAccount = useUnlinkAccount();

  const enabledProviders = providersQuery.data?.providers ?? [];
  const accounts = accountsQuery.data?.success ? accountsQuery.data.accounts : [];
  const hasPassword = accountsQuery.data?.success ? accountsQuery.data.hasPassword : true;

  // Enabled providers plus anything linked while a provider was still enabled.
  const providers = [...new Set<OAuthProviderId>([
    ...enabledProviders.map(provider => provider.id),
    ...accounts.map(account => account.provider as OAuthProviderId).filter(provider => provider in OAUTH_PROVIDER_META),
  ])];

  // Server label wins (custom SSO label); META covers disabled-since providers.
  const providerLabel = (provider: OAuthProviderId) =>
    enabledProviders.find(p => p.id === provider)?.label ?? OAUTH_PROVIDER_META[provider].label;

  const isLoading = providersQuery.isLoading || accountsQuery.isLoading;

  if (!isLoading && providers.length === 0) {
    return null;
  }

  const handleUnlink = async (provider: OAuthProviderId) => {
    const confirmed = await sayno.confirm({
      title: t("account.linkedAccounts.unlink"),
      description: t("account.linkedAccounts.unlinkConfirm", { provider: providerLabel(provider) }),
      variant: "destructive",
    });

    if (confirmed) {
      unlinkAccount.mutate(provider);
    }
  };

  return (
    <FormSection
      flush
      index={<LinkIcon />}
      title={t("account.sections.linkedAccounts.title")}
      sub={t("account.sections.linkedAccounts.description")}
    >
      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted" />
        </div>
      )}

      {!isLoading && (
        <div className="divide-y divide-line">
          {providers.map((provider) => {
            const Icon = OAUTH_PROVIDER_META[provider].icon;
            const account = accounts.find(a => a.provider === provider);
            const isLastAuthMethod = !hasPassword && accounts.length <= 1;

            return (
              <div key={provider} className="flex items-center gap-3.5 px-5 py-3.5">
                <div className="grid size-9.5 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-muted">
                  <Icon className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-ink">
                    {providerLabel(provider)}
                    {account && <Badge tone="sage" dot>{t("account.linkedAccounts.linked")}</Badge>}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted">
                    {account?.email ?? t("account.linkedAccounts.notLinked")}
                  </div>
                </div>
                {account
                  ? (
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={unlinkAccount.isPending || isLastAuthMethod}
                        title={isLastAuthMethod ? t("account.linkedAccounts.lastMethodTooltip") : undefined}
                        onClick={() => handleUnlink(provider)}
                      >
                        {t("account.linkedAccounts.unlink")}
                      </Button>
                    )
                  : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.assign(oauthStartUrl(provider, { redirect: "/account" }))}
                      >
                        {t("account.linkedAccounts.link")}
                      </Button>
                    )}
              </div>
            );
          })}
        </div>
      )}
    </FormSection>
  );
}

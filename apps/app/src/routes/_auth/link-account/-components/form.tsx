import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";
import type { FormEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { oauthStartUrl } from "@/api/oauth/oauth.api";
import { pendingLinkQueryOptions } from "@/api/oauth/oauth.queries";
import { OAUTH_PROVIDER_META } from "@/components/oauth-buttons";
import { PasswordInput } from "@/components/password-input";
import { useCompletePendingLink } from "@/hooks/oauth/use-complete-pending-link";
import { rollbackAuthMethod, setLastAuthMethod, setOptimisticAuthMethod } from "@/lib/last-auth-method";
import { Button } from "~orbit/components/ui/Button";
import { ArrowLeft, Link as LinkIcon, Loader2, TriangleAlert } from "~orbit/components/ui/icons";
import { Field } from "~orbit/components/ui/Input";
import { cn } from "~orbit/lib/utils";

type LinkAccountFormProps = React.ComponentProps<"div"> & {
  token?: string;
  error?: string;
};

export function LinkAccountForm({ token, error, className, ...props }: LinkAccountFormProps) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();

  const pendingQuery = useQuery({ ...pendingLinkQueryOptions(token ?? ""), enabled: !!token });
  const completePendingLink = useCompletePendingLink();

  // Surface a failed provider re-auth attempt once.
  useEffect(() => {
    if (error === "confirm_failed") {
      // The confirm button optimistically recorded itself as last method.
      rollbackAuthMethod();
      toast.error(t("oauth.errors.confirm_failed"));
    }
  }, [error, t]);

  const form = useForm({
    defaultValues: {
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await completePendingLink.mutateAsync({ token: token!, password: value.password });
        // The session now comes from the freshly linked provider sign-in.
        const provider = pendingQuery.data?.success ? pendingQuery.data.pendingLink.provider : null;
        if (provider && provider in OAUTH_PROVIDER_META) {
          setLastAuthMethod(provider as OAuthProviderId);
        }
        return navigate({ href: "/", replace: true });
      } catch {
        throw toast.error(t("linkAccount.invalidPassword"));
      }
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    form.handleSubmit();
  }

  // Missing / invalid / expired token
  if (!token || pendingQuery.error) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-amber-soft">
            <TriangleAlert className="size-6 text-amber-deep" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{t("linkAccount.invalid.title")}</h1>
          <p className="text-sm text-muted">{t("linkAccount.invalid.description")}</p>
        </div>
        <Button asChild className="w-full">
          <Link to="/login">{t("linkAccount.backToLogin")}</Link>
        </Button>
      </div>
    );
  }

  // Validating the token
  if (pendingQuery.isPending || !pendingQuery.data?.success) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4 py-14", className)} {...props}>
        <Loader2 className="size-7 animate-spin text-muted" />
        <p className="text-sm text-muted">{t("linkAccount.validating")}</p>
      </div>
    );
  }

  const { pendingLink } = pendingQuery.data;
  const providerLabel = OAUTH_PROVIDER_META[pendingLink.provider as OAuthProviderId]?.label ?? pendingLink.provider;
  const linkedProviders = pendingLink.linkedProviders.filter(
    (provider): provider is OAuthProviderId => provider in OAUTH_PROVIDER_META,
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-accent/10">
          <LinkIcon className="size-6 text-accent" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t("linkAccount.title", { provider: providerLabel })}</h1>
        <p className="text-sm text-muted">{t("linkAccount.subtitle", { email: pendingLink.email, provider: providerLabel })}</p>
      </div>

      {pendingLink.hasPassword
        ? (
            <form
              className="flex flex-col gap-5"
              onSubmit={handleSubmit}
              onKeyDown={e => e.key === "Enter" && e.currentTarget.requestSubmit()}
            >
              <form.Field
                name="password"
                children={field => (
                  <Field label={t("fields.password")} htmlFor={field.name}>
                    <PasswordInput
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={e => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              />
              <form.Subscribe
                selector={state => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit} className="w-full">
                    {isSubmitting
                      ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            {t("linkAccount.pending")}
                          </>
                        )
                      : t("linkAccount.submit")}
                  </Button>
                )}
              />
            </form>
          )
        : (
            <div className="flex flex-col gap-3">
              {linkedProviders.map((provider) => {
                const meta = OAUTH_PROVIDER_META[provider];
                const Icon = meta.icon;

                return (
                  <Button
                    key={provider}
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setOptimisticAuthMethod(provider);
                      window.location.assign(oauthStartUrl(provider, { linkToken: token }));
                    }}
                  >
                    <Icon className="size-4" />
                    {t("linkAccount.confirmWith", { provider: meta.label })}
                  </Button>
                );
              })}
            </div>
          )}

      <div className="text-center text-sm">
        <Link to="/login" className="inline-flex items-center gap-1 font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
          <ArrowLeft className="size-3.5" />
          {t("linkAccount.backToLogin")}
        </Link>
      </div>
    </div>
  );
}

import type { FormEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import { configQueryOptions } from "@/api/configs/configs.queries";
import { OAuthButtons } from "@/components/oauth-buttons";
import { PasswordInput } from "@/components/password-input";
import { useOAuthProviders } from "@/hooks/oauth/use-oauth-providers";
import { api } from "@/lib/http";
import { getLastAuthMethod, rollbackAuthMethod, setLastAuthMethod } from "@/lib/last-auth-method";
import { OAUTH_ERROR_CODES } from "@/lib/oauth-meta";
import { Badge } from "~orbit/components/ui/Badge";
import { Button } from "~orbit/components/ui/Button";
import { Loader2 } from "~orbit/components/ui/icons";
import { Field, Input } from "~orbit/components/ui/Input";
import { cn } from "~orbit/lib/utils";
import { inferConfigValue } from "~shared/helpers/infer-config-value";
import { LoginSchema } from "~shared/schemas/api/auth.schemas";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { t } = useTranslation("auth");

  const { data: config } = useQuery(configQueryOptions("authentication.register.enable"));
  const enableRegister = config ? inferConfigValue(config.value.value!) : false;

  const navigate = useNavigate();
  const location = useRouterState({ select: s => s.location });
  const searchParams = new URLSearchParams(location.searchStr);
  const redirectTo = searchParams.get("redirect") ?? "/";
  const oauthError = searchParams.get("oauthError");

  const lastMethod = getLastAuthMethod();

  // With no OAuth provider enabled, password is the only method — the
  // "last used" badge would just point at the only button on the page.
  const { data: oauthData } = useOAuthProviders();
  const hasMultipleMethods = (oauthData?.providers.length ?? 0) > 0;

  // Surface OAuth callback errors once, then strip the param from the URL.
  useEffect(() => {
    if (!oauthError) return;

    // The provider button optimistically recorded itself as last method.
    rollbackAuthMethod();

    const code = OAUTH_ERROR_CODES.includes(oauthError) ? oauthError : "oauth_failed";
    toast.error(t(`oauth.errors.${code}` as never));

    const params = new URLSearchParams(location.searchStr);
    params.delete("oauthError");
    // Stay in manual mode: without it, SSO auto-login would immediately
    // bounce the visitor back to the IdP they just failed at.
    params.set("manual", "1");
    navigate({ href: `/login?${params}`, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oauthError]);

  const form = useForm({
    validators: { onSubmit: LoginSchema },
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const res = await api.auth.login.$post({ json: value });
      const json = await res.json();

      if (json.success) {
        setLastAuthMethod("password");
        return navigate({ href: redirectTo, replace: true });
      }

      throw toast.error(typeof json.error === "string" ? json.error : json.error.message);
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    form.handleSubmit();
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t("login.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("login.subtitle")}</p>
      </div>
      <OAuthButtons redirectTo={redirectTo} />
      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit}
        onKeyDown={e => e.key === "Enter" && e.currentTarget.requestSubmit()}
      >
        <form.Field
          name="email"
          children={field => (
            <Field label={t("fields.email")} htmlFor={field.name}>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
                placeholder="m@example.com"
                invalid={field.state.meta.isTouched && !field.state.meta.isValid}
              />
              {field.state.meta.isTouched && !field.state.meta.isValid && field.state.meta.errors[0]?.message && (
                <p className="text-xs text-coral-deep">{t(`errors.${field.name}.${field.state.meta.errors[0]?.message}` as never)}</p>
              )}
            </Field>
          )}
        />
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
              {field.state.meta.isTouched && !field.state.meta.isValid && field.state.meta.errors[0]?.message && (
                <p className="text-xs text-coral-deep">{t(`errors.${field.name}.${field.state.meta.errors[0]?.message}` as never)}</p>
              )}
            </Field>
          )}
        />
        <div className="-mt-2 text-right text-sm">
          <Link to="/forgot-password" search={location.search} className="font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
            {t("login.forgotPassword")}
          </Link>
        </div>
        <form.Subscribe
          selector={state => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit} className="w-full">
              {isSubmitting
                ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      {t("login.pending")}
                    </>
                  )
                : t("login.submit")}
              {hasMultipleMethods && lastMethod === "password" && !isSubmitting && (
                <Badge tone="accent" className="absolute -right-2 -top-2 ring-2 ring-paper">{t("login.lastUsed")}</Badge>
              )}
            </Button>
          )}
        />
        {enableRegister && (
          <div className="text-center text-sm text-muted">
            <Trans i18nKey="login.cta" ns="auth" components={{ Link: <Link key="link" to="/register" search={location.search} className="font-medium text-ink underline underline-offset-4" /> }} />
          </div>
        )}
      </form>
    </div>
  );
}

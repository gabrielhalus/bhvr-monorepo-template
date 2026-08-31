import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";
import type { FormEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { pendingSignupQueryOptions } from "@/api/oauth/oauth.queries";
import { useCompletePendingSignup } from "@/hooks/oauth/use-complete-pending-signup";
import { ApiError } from "@/lib/http";
import { setLastAuthMethod } from "@/lib/last-auth-method";
import { OAUTH_PROVIDER_META } from "@/lib/oauth-meta";
import { Button } from "~orbit/components/ui/Button";
import { ArrowLeft, Loader2, TriangleAlert, UserPlus } from "~orbit/components/ui/icons";
import { Field, Input } from "~orbit/components/ui/Input";
import { cn } from "~orbit/lib/utils";
import { CompletePendingSignupSchema } from "~shared/schemas/api/oauth.schemas";

/** Errors the completion endpoint can return, each with its own message. */
const COMPLETION_ERROR_CODES = ["invalid_token", "registration_disabled", "account_exists"] as const;

const CompleteSignupFormSchema = CompletePendingSignupSchema.omit({ token: true });

/**
 * Keep the post-signup landing on this origin. The API already sanitizes the
 * value it puts in the URL, so this only guards a hand-edited address bar.
 */
function safeRedirect(raw: string | undefined): string {
  return raw && /^\/(?!\/)/.test(raw) ? raw : "/";
}

type PendingSignup = {
  provider: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

type CompleteSignupFormProps = React.ComponentProps<"div"> & {
  token?: string;
  redirectTo?: string;
};

export function CompleteSignupForm({ token, redirectTo, className, ...props }: CompleteSignupFormProps) {
  const { t } = useTranslation("auth");

  const pendingQuery = useQuery({ ...pendingSignupQueryOptions(token ?? ""), enabled: !!token });

  // Missing / invalid / expired token
  if (!token || pendingQuery.error) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-amber-soft">
            <TriangleAlert className="size-6 text-amber-deep" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{t("completeSignup.invalid.title")}</h1>
          <p className="text-sm text-muted">{t("completeSignup.invalid.description")}</p>
        </div>
        <Button asChild className="w-full">
          <Link to="/login" search={{ manual: true }}>{t("completeSignup.backToLogin")}</Link>
        </Button>
      </div>
    );
  }

  // Validating the token
  if (pendingQuery.isPending || !pendingQuery.data.success) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4 py-14", className)} {...props}>
        <Loader2 className="size-7 animate-spin text-muted" />
        <p className="text-sm text-muted">{t("completeSignup.validating")}</p>
      </div>
    );
  }

  // Mounted only once the profile is known: the form seeds its fields from it,
  // and TanStack Form reads `defaultValues` at init only.
  return (
    <SignupFields
      token={token}
      redirectTo={redirectTo}
      pendingSignup={pendingQuery.data.pendingSignup}
      className={className}
      {...props}
    />
  );
}

function SignupFields({ token, redirectTo, pendingSignup, className, ...props }: CompleteSignupFormProps & {
  token: string;
  pendingSignup: PendingSignup;
}) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();

  const completePendingSignup = useCompletePendingSignup();

  const form = useForm({
    validators: { onSubmit: CompleteSignupFormSchema },
    defaultValues: {
      // Whatever the provider did supply is kept as a starting point — a
      // single-word name lands in `firstName` and leaves the rest to fill in.
      firstName: pendingSignup.firstName ?? "",
      lastName: pendingSignup.lastName ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        await completePendingSignup.mutateAsync({ token, ...value });

        if (pendingSignup.provider in OAUTH_PROVIDER_META) {
          setLastAuthMethod(pendingSignup.provider as OAuthProviderId);
        }

        return navigate({ href: safeRedirect(redirectTo), replace: true });
      } catch (error) {
        const code = error instanceof ApiError ? error.code : undefined;
        const known = COMPLETION_ERROR_CODES.find(candidate => candidate === code) ?? "oauth_failed";

        throw toast.error(t(`completeSignup.errors.${known}` as never));
      }
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    form.handleSubmit();
  }

  const providerLabel = OAUTH_PROVIDER_META[pendingSignup.provider as OAuthProviderId]?.label ?? pendingSignup.provider;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-accent/10">
          <UserPlus className="size-6 text-accent" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t("completeSignup.title")}</h1>
        <p className="text-sm text-muted">{t("completeSignup.subtitle", { email: pendingSignup.email, provider: providerLabel })}</p>
      </div>

      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit}
        onKeyDown={e => e.key === "Enter" && e.currentTarget.requestSubmit()}
      >
        <form.Field
          name="firstName"
          children={field => (
            <Field label={t("fields.firstName")} htmlFor={field.name}>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
                autoFocus={!pendingSignup.firstName}
                invalid={field.state.meta.isTouched && !field.state.meta.isValid}
              />
              {field.state.meta.isTouched && !field.state.meta.isValid && field.state.meta.errors[0]?.message && (
                <p className="text-xs text-coral-deep">{t(`errors.${field.name}.${field.state.meta.errors[0]?.message}` as never)}</p>
              )}
            </Field>
          )}
        />
        <form.Field
          name="lastName"
          children={field => (
            <Field label={t("fields.lastName")} htmlFor={field.name}>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
                autoFocus={!!pendingSignup.firstName && !pendingSignup.lastName}
                invalid={field.state.meta.isTouched && !field.state.meta.isValid}
              />
              {field.state.meta.isTouched && !field.state.meta.isValid && field.state.meta.errors[0]?.message && (
                <p className="text-xs text-coral-deep">{t(`errors.${field.name}.${field.state.meta.errors[0]?.message}` as never)}</p>
              )}
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
                      {t("completeSignup.pending")}
                    </>
                  )
                : t("completeSignup.submit")}
            </Button>
          )}
        />
      </form>

      <div className="text-center text-sm">
        <Link to="/login" search={{ manual: true }} className="inline-flex items-center gap-1 font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
          <ArrowLeft className="size-3.5" />
          {t("completeSignup.backToLogin")}
        </Link>
      </div>
    </div>
  );
}

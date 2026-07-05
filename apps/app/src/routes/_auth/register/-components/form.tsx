import type { FormEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import { PasswordInput } from "@/components/password-input";
import { api } from "@/lib/http";
import { Button } from "~orbit/components/ui/Button";
import { Loader2 } from "~orbit/components/ui/icons";
import { Field, Input } from "~orbit/components/ui/Input";
import { cn } from "~orbit/lib/utils";
import { debounceAsync } from "~shared/lib/debounce";
import { passwordChecks, passwordRules, RegisterSchema } from "~shared/schemas/api/auth.schemas";

const checkEmail = debounceAsync(async (email: string): Promise<string | void> => {
  const res = await api.users["check-email"].$get({ query: { email } });

  if (!res.ok) {
    return "failRequestErrorMessage";
  }

  const resData = await res.json();

  if (!resData.available) {
    return "alreadyTakenErrorMessage";
  }
}, 500);

type RegisterFormProps = React.ComponentProps<"div"> & {
  /** First-run setup: the account being created is the system administrator. */
  needsSetup?: boolean;
};

export function RegisterForm({ className, needsSetup = false, ...props }: RegisterFormProps) {
  const { t } = useTranslation("auth");

  const navigate = useNavigate();
  const location = useRouterState({ select: s => s.location });
  const searchParams = new URLSearchParams(location.searchStr);
  const redirectTo = searchParams.get("redirect") ?? "/";

  const form = useForm({
    validators: { onSubmit: RegisterSchema },
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const res = await api.auth.register.$post({ json: value });
      const json = await res.json();

      if (json.success) {
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
        <h1 className="text-2xl font-bold tracking-tight text-ink">{needsSetup ? t("register.setup.title") : t("register.title")}</h1>
        <p className="mt-1 text-sm text-muted">{needsSetup ? t("register.setup.subtitle") : t("register.subtitle")}</p>
      </div>
      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit}
        onKeyDown={e => e.key === "Enter" && e.currentTarget.requestSubmit()}
      >
        <div className="grid grid-cols-2 gap-4">
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
                  invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                />
                {field.state.meta.isTouched && !field.state.meta.isValid && field.state.meta.errors[0]?.message && (
                  <p className="text-xs text-coral-deep">{t(`errors.${field.name}.${field.state.meta.errors[0]?.message}` as never)}</p>
                )}
              </Field>
            )}
          />
        </div>
        <form.Field
          name="email"
          validators={{
            onChangeAsync: async ({ value }) => {
              const error = await checkEmail(value);
              return error ? { message: error } : undefined;
            },
          }}
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
                rules={passwordRules}
                checks={passwordChecks}
                showRequirements
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
                      {t("register.pending")}
                    </>
                  )
                : t("register.submit")}
            </Button>
          )}
        />
        {!needsSetup && (
          <div className="text-center text-sm text-muted">
            <Trans i18nKey="register.cta" ns="auth" components={{ Link: <Link key="link" to="/" search={location.search} className="font-medium text-ink underline underline-offset-4" /> }} />
          </div>
        )}
      </form>
    </div>
  );
}

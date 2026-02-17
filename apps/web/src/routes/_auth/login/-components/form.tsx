import type { FormEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import { runtimeConfigQueryOptions } from "@/api/runtime-configs/runtime-configs.queries";
import { Button } from "~react/components/button";
import { Card, CardContent } from "~react/components/card";
import { Field, FieldContent, FieldError, FieldLabel } from "~react/components/field";
import { Input } from "~react/components/input";
import { PasswordInput } from "~react/components/password-input";
import { Spinner } from "~react/components/spinner";
import { api } from "~react/lib/http";
import { cn } from "~react/lib/utils";
import { inferConfigValue } from "~shared/helpers/infer-config-value";
import { LoginSchema } from "~shared/schemas/api/auth.schemas";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { t } = useTranslation("auth");

  const { data: config } = useQuery(runtimeConfigQueryOptions("authentication.disableRegister"));
  const disableRegister = config ? inferConfigValue(config.value.value!) : false;

  const navigate = useNavigate();
  const location = useRouterState({ select: s => s.location });
  const searchParams = new URLSearchParams(location.searchStr);
  const redirectTo = searchParams.get("redirect") ?? "/";

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
    <div className={cn("flex flex-col gap-5", className)} {...props}>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("login.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("login.subtitle", { defaultValue: "Welcome back. Sign in to continue." })}</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form
            onSubmit={handleSubmit}
            onKeyDown={e => e.key === "Enter" && e.currentTarget.requestSubmit()}
          >
            <div className="grid gap-5">
              <div className="grid gap-5">
                <form.Field
                  name="email"
                  children={field => (
                    <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                      <FieldLabel htmlFor={field.name}>{t("fields.email")}</FieldLabel>
                      <FieldContent>
                        <Input
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={e => field.handleChange(e.target.value)}
                          placeholder="m@example.com"
                        />
                        <FieldError errors={field.state.meta.errors}>
                          {field.state.meta.isTouched && !field.state.meta.isValid && field.state.meta.errors[0]?.message
                            ? t(`errors.${field.name}.${field.state.meta.errors[0]?.message}`)
                            : null}
                        </FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />
                <form.Field
                  name="password"
                  children={field => (
                    <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                      <FieldLabel htmlFor={field.name}>{t("fields.password")}</FieldLabel>
                      <FieldContent>
                        <PasswordInput
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={e => field.handleChange(e.target.value)}
                        />
                        <FieldError errors={field.state.meta.errors}>
                          {field.state.meta.isTouched && !field.state.meta.isValid && field.state.meta.errors[0]?.message
                            ? t(`errors.${field.name}.${field.state.meta.errors[0]?.message}`)
                            : null}
                        </FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />
                <form.Subscribe
                  selector={state => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, isSubmitting]) => (
                    <Button type="submit" disabled={!canSubmit}>
                      {isSubmitting
                        ? (
                            <span className="flex items-center gap-2">
                              <Spinner />
                              {t("login.pending")}
                            </span>
                          )
                        : t("login.submit")}
                    </Button>
                  )}
                />
              </div>
              {!disableRegister && (
                <div className="text-center text-sm">
                  <Trans i18nKey="login.cta" ns="auth" components={{ Link: <Link key="link" to="/register" search={location.search} className="underline underline-offset-4" /> }} />
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

}

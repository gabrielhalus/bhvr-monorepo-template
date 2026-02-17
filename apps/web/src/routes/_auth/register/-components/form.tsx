import type { FormEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "~react/components/button";
import { Card, CardContent } from "~react/components/card";
import { Field, FieldContent, FieldError, FieldLabel } from "~react/components/field";
import { Input } from "~react/components/input";
import { PasswordInput } from "~react/components/password-input";
import { Spinner } from "~react/components/spinner";
import { api } from "~react/lib/http";
import { cn } from "~react/lib/utils";
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

export function RegisterForm({ className, ...props }: React.ComponentProps<"div">) {
  const { t } = useTranslation("auth");

  const navigate = useNavigate();
  const location = useRouterState({ select: s => s.location });
  const searchParams = new URLSearchParams(location.searchStr);
  const redirectTo = searchParams.get("redirect") ?? "/";

  const form = useForm({
    validators: { onSubmit: RegisterSchema },
    defaultValues: {
      name: "",
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
    <div className={cn("flex flex-col gap-5", className)} {...props}>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("register.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("register.subtitle", { defaultValue: "Create your account to get started." })}</p>
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
                  name="name"
                  children={field => (
                    <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                      <FieldLabel htmlFor={field.name}>{t("fields.name")}</FieldLabel>
                      <FieldContent>
                        <Input
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={e => field.handleChange(e.target.value)}
                          placeholder="John Doe"
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
                  name="email"
                  validators={{
                    onChangeAsync: async ({ value }) => {
                      const error = await checkEmail(value);
                      return error ? { message: error } : undefined;
                    },
                  }}
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
                          rules={passwordRules}
                          checks={passwordChecks}
                          showRequirements
                        />
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
                              {t("register.pending")}
                            </span>
                          )
                        : t("register.submit")}
                    </Button>
                  )}
                />
              </div>
              <div className="text-center text-sm">
                <Trans i18nKey="register.cta" ns="auth" components={{ Link: <Link key="link" to="/" search={location.search} className="underline underline-offset-4" /> }} />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

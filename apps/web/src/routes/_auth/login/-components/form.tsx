import { useForm } from "@tanstack/react-form";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@bunstack/react/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@bunstack/react/components/card";
import { Input } from "@bunstack/react/components/input";
import { Label } from "@bunstack/react/components/label";
import { PasswordInput } from "@bunstack/react/components/password-input";
import { Spinner } from "@bunstack/react/components/spinner";
import { api } from "@bunstack/react/lib/http";
import { cn } from "@bunstack/react/lib/utils";
import { loginInputSchema } from "@bunstack/shared/contracts/auth";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { t } = useTranslation("auth");

  const navigate = useNavigate();
  const location = useRouterState({ select: s => s.location });
  const searchParams = new URLSearchParams(location.searchStr);
  const redirectTo = searchParams.get("redirect") || "/web";

  const form = useForm({
    validators: { onChange: loginInputSchema },
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

      toast.error(json.error);
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("login.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit(e);
          }}
          >
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <form.Field
                    name="email"
                    children={field => (
                      <>
                        <Label htmlFor={field.name}>{t("fields.email")}</Label>
                        <Input
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={e => field.handleChange(e.target.value)}
                          type="email"
                          placeholder="m@example.com"
                          required
                        />
                        {field.state.meta.isTouched && !field.state.meta.isValid
                          ? (
                              <p className="text-destructive text-sm">
                                {t(`errors.${field.name}.${field.state.meta.errors[0]?.message}`)}
                              </p>
                            )
                          : null}
                      </>
                    )}
                  />
                </div>
                <div className="grid gap-3">
                  <form.Field
                    name="password"
                    children={field => (
                      <>
                        <Label htmlFor={field.name}>{t("fields.password")}</Label>
                        <PasswordInput
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={e => field.handleChange(e.target.value)}
                          required
                        />
                        {field.state.meta.isTouched && !field.state.meta.isValid
                          ? (
                              <p className="text-destructive text-sm">
                                {t(`errors.${field.name}.${field.state.meta.errors[0]?.message}`)}
                              </p>
                            )
                          : null}
                      </>
                    )}
                  />
                </div>
                <form.Subscribe
                  selector={state => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, isSubmitting]) => (
                    <>
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
                    </>
                  )}
                />
              </div>
              <div className="text-center text-sm">
                <Trans i18nKey="login.cta" ns="auth" components={{ Link: <Link key="link" to="/register" search={location.search} className="underline underline-offset-4" /> }} />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

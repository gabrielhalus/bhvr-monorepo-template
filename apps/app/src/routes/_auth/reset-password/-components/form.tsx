import type { FormEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { PasswordInput } from "@/components/password-input";
import { api } from "@/lib/http";
import { Button } from "~orbit/components/ui/Button";
import { ArrowLeft, Loader2, TriangleAlert } from "~orbit/components/ui/icons";
import { Field } from "~orbit/components/ui/Input";
import { cn } from "~orbit/lib/utils";
import { passwordChecks, passwordRules, ResetPasswordSchema } from "~shared/schemas/api/auth.schemas";

type ResetPasswordFormProps = React.ComponentProps<"div"> & {
  token?: string;
};

export function ResetPasswordForm({ token, className, ...props }: ResetPasswordFormProps) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();

  const { data, isPending, error } = useQuery({
    queryKey: ["reset-password", "validate", token],
    queryFn: async () => {
      const res = await api.auth["reset-password"].validate.$get({ query: { token: token! } });
      if (!res.ok) throw new Error("Failed to validate token");
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const form = useForm({
    validators: { onSubmit: ResetPasswordSchema.pick({ password: true }) },
    defaultValues: {
      password: "",
    },
    onSubmit: async ({ value }) => {
      const res = await api.auth["reset-password"].$post({ json: { token: token!, password: value.password } });
      const json = await res.json();

      if (json.success) {
        toast.success(t("resetPassword.success"));
        return navigate({ to: "/login", replace: true });
      }

      throw toast.error(typeof json.error === "string" ? json.error : json.error.message);
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    form.handleSubmit();
  }

  // Missing / invalid / expired token
  if (!token || error || (data && !data.valid)) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-amber-soft">
            <TriangleAlert className="size-6 text-amber-deep" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{t("resetPassword.invalid.title")}</h1>
          <p className="text-sm text-muted">{t("resetPassword.invalid.description")}</p>
        </div>
        <Button asChild className="w-full">
          <Link to="/forgot-password">{t("resetPassword.invalid.requestNew")}</Link>
        </Button>
      </div>
    );
  }

  // Validating the token
  if (isPending) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4 py-14", className)} {...props}>
        <Loader2 className="size-7 animate-spin text-muted" />
        <p className="text-sm text-muted">{t("resetPassword.validating")}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t("resetPassword.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("resetPassword.subtitle")}</p>
      </div>
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
                      {t("resetPassword.pending")}
                    </>
                  )
                : t("resetPassword.submit")}
            </Button>
          )}
        />
        <div className="text-center text-sm">
          <Link to="/login" className="inline-flex items-center gap-1 font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
            <ArrowLeft className="size-3.5" />
            {t("resetPassword.backToLogin")}
          </Link>
        </div>
      </form>
    </div>
  );
}

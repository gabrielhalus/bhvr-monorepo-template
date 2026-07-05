import type { FormEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { api } from "@/lib/http";
import { Button } from "~orbit/components/ui/Button";
import { ArrowLeft, CheckCircle2, Loader2 } from "~orbit/components/ui/icons";
import { Field, Input } from "~orbit/components/ui/Input";
import { cn } from "~orbit/lib/utils";
import { ForgotPasswordSchema } from "~shared/schemas/api/auth.schemas";

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const { t } = useTranslation("auth");
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    validators: { onSubmit: ForgotPasswordSchema },
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      const res = await api.auth["forgot-password"].$post({ json: value });
      const json = await res.json();

      if (json.success) {
        setSubmitted(true);
        return;
      }

      throw toast.error(typeof json.error === "string" ? json.error : json.error.message);
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    form.handleSubmit();
  }

  if (submitted) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-sage-soft">
            <CheckCircle2 className="size-6 text-sage-deep" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{t("forgotPassword.success.title")}</h1>
          <p className="text-sm text-muted">{t("forgotPassword.success.description")}</p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link to="/login">
            <ArrowLeft className="size-3.5" />
            {t("forgotPassword.backToLogin")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t("forgotPassword.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("forgotPassword.subtitle")}</p>
      </div>
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
        <form.Subscribe
          selector={state => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit} className="w-full">
              {isSubmitting
                ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      {t("forgotPassword.pending")}
                    </>
                  )
                : t("forgotPassword.submit")}
            </Button>
          )}
        />
        <div className="text-center text-sm">
          <Link to="/login" className="font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
            {t("forgotPassword.backToLogin")}
          </Link>
        </div>
      </form>
    </div>
  );
}

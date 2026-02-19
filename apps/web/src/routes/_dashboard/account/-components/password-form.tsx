import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useChangePassword } from "@/hooks/users/use-change-password";
import { Button } from "~react/components/button";
import { Field, FieldContent, FieldError, FieldLabel } from "~react/components/field";
import { PasswordInput } from "~react/components/password-input";
import { Separator } from "~react/components/separator";
import { Spinner } from "~react/components/spinner";
import { ChangePasswordSchema, passwordChecks, passwordRules } from "~shared/schemas/api/auth.schemas";

const PasswordFormSchema = ChangePasswordSchema.extend({
  confirmPassword: z.string(),
});

const defaultValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function PasswordForm({ userId: _userId }: { userId: string }) {
  const { t } = useTranslation(["common", "web"]);

  const mutation = useChangePassword();

  const form = useForm({
    validators: { onChange: PasswordFormSchema },
    defaultValues,
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
      });
      form.reset();
    },
  });

  return (
    <div>
      <div className="px-6 py-5">
        <h3 className="font-bold leading-none">{t("web:pages.account.sections.password.title")}</h3>
        <p className="text-muted-foreground text-sm mt-1.5">{t("web:pages.account.sections.password.description")}</p>
      </div>
      <div className="px-6 py-5 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit(e);
          }}
        >
          <div className="grid gap-4">
            <form.Field
              name="currentPassword"
              children={field => (
                <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("web:pages.account.fields.currentPassword")}
                  </FieldLabel>
                  <FieldContent>
                    <PasswordInput
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={e => field.handleChange(e.target.value)}
                      showRequirements={false}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            />
            <form.Field
              name="newPassword"
              children={field => (
                <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("web:pages.account.fields.newPassword")}
                  </FieldLabel>
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
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            />
            <form.Field
              name="confirmPassword"
              validators={{
                onChangeListenTo: ["newPassword"],
                onChange: ({ value, fieldApi }) => {
                  if (value && value !== fieldApi.form.getFieldValue("newPassword")) {
                    return { message: t("web:pages.account.fields.passwordMismatch") };
                  }
                  return undefined;
                },
              }}
              children={field => (
                <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("web:pages.account.fields.confirmPassword")}
                  </FieldLabel>
                  <FieldContent>
                    <PasswordInput
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={e => field.handleChange(e.target.value)}
                      showRequirements={false}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            />

            <Separator />

            <form.Subscribe
              selector={state => [state.canSubmit, state.isSubmitting, state.isDefaultValue]}
              children={([canSubmit, isSubmitting, isDefaultValue]) => (
                <Button type="submit" disabled={!canSubmit || isDefaultValue} className="w-fit">
                  {isSubmitting
                    ? (
                        <span className="flex items-center space-x-2">
                          <Spinner />
                          {t("common:form.saving")}
                        </span>
                      )
                    : t("web:pages.account.sections.password.submit")}
                </Button>
              )}
            />
          </div>
        </form>
      </div>
    </div>
  );
}

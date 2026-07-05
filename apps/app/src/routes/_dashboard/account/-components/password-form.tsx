import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Fg, FormSection, SecFoot } from "@/components/form-kit";
import { PasswordInput } from "@/components/password-input";
import { useChangePassword } from "@/hooks/users/use-change-password";
import { Button } from "~orbit/components/ui/Button";
import { Loader2, Lock } from "~orbit/components/ui/icons";
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
  const { t } = useTranslation("web");

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
    <FormSection
      flush
      index={<Lock />}
      title={t("account.sections.password.title")}
      sub={t("account.sections.password.description")}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit(e);
        }}
      >
        <div className="flex max-w-md flex-col gap-4 p-5">
          <form.Field
            name="currentPassword"
            children={field => (
              <Fg label={t("account.fields.currentPassword")} htmlFor={field.name} req>
                <PasswordInput
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  showRequirements={false}
                />
                {field.state.meta.isTouched && field.state.meta.errors[0] && (
                  <p className="text-[10.5px] text-coral-deep">{String(field.state.meta.errors[0]?.message ?? field.state.meta.errors[0])}</p>
                )}
              </Fg>
            )}
          />
          <form.Field
            name="newPassword"
            children={field => (
              <Fg label={t("account.fields.newPassword")} htmlFor={field.name} req>
                <PasswordInput
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  rules={passwordRules}
                  checks={passwordChecks}
                  showRequirements
                />
              </Fg>
            )}
          />
          <form.Field
            name="confirmPassword"
            validators={{
              onChangeListenTo: ["newPassword"],
              onChange: ({ value, fieldApi }) => {
                if (value && value !== fieldApi.form.getFieldValue("newPassword")) {
                  return { message: t("account.fields.passwordMismatch") };
                }
                return undefined;
              },
            }}
            children={field => (
              <Fg label={t("account.fields.confirmPassword")} htmlFor={field.name} req>
                <PasswordInput
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  showRequirements={false}
                />
                {field.state.meta.isTouched && field.state.meta.errors[0] && (
                  <p className="text-[10.5px] text-coral-deep">{String(field.state.meta.errors[0]?.message ?? field.state.meta.errors[0])}</p>
                )}
              </Fg>
            )}
          />
        </div>

        <form.Subscribe
          selector={state => [state.canSubmit, state.isSubmitting, state.isDefaultValue]}
          children={([canSubmit, isSubmitting, isDefaultValue]) => (
            <SecFoot note={t("account.sections.password.note")}>
              <Button type="submit" size="sm" disabled={!canSubmit || isDefaultValue}>
                {isSubmitting
                  ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        {t("form.saving")}
                      </>
                    )
                  : (
                      <>
                        <Lock className="size-3.5" />
                        {t("account.sections.password.submit")}
                      </>
                    )}
              </Button>
            </SecFoot>
          )}
        />
      </form>
    </FormSection>
  );
}

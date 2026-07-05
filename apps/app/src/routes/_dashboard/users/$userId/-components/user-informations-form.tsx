import type { z } from "zod";

import { useForm } from "@tanstack/react-form";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { Fg, FieldGrid, FormSection, SecFoot } from "@/components/form-kit";
import { useUpdateUser } from "@/hooks/users/use-update-user";
import { useUser } from "@/hooks/users/use-user";
import { Button } from "~orbit/components/ui/Button";
import { Loader2, Save, User } from "~orbit/components/ui/icons";
import { Input } from "~orbit/components/ui/Input";
import { UpdateAccountSchema } from "~shared/schemas/api/auth.schemas";

export function UserInformationsForm({ userId }: { userId: string }) {
  const { t } = useTranslation("web");

  const userQuery = useUser(userId);

  const formRef = useRef<{ reset: (values: z.infer<typeof UpdateAccountSchema>) => void } | null>(null);

  const mutation = useUpdateUser();

  const handleSuccess = (response: { user: { firstName: string; lastName: string; email: string } }) => {
    formRef.current?.reset({ firstName: response.user.firstName, lastName: response.user.lastName, email: response.user.email });
  };

  const form = useForm({
    validators: { onChange: UpdateAccountSchema },
    defaultValues: {
      firstName: userQuery.data?.user.firstName ?? "",
      lastName: userQuery.data?.user.lastName ?? "",
      email: userQuery.data?.user.email ?? "",
    },
    onSubmit: async ({ value }) => {
      const response = await mutation.mutateAsync({ id: userId, data: value });
      handleSuccess(response);
    },
  });

  formRef.current = form;

  return (
    <FormSection
      flush
      index={<User />}
      title={t("users.detail.sections.edit.title")}
      sub={t("users.detail.sections.edit.description")}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit(e);
        }}
      >
        <div className="p-5">
          <FieldGrid>
            <form.Field
              name="firstName"
              children={field => (
                <Fg label={t("users.detail.fields.firstName")} htmlFor={field.name} req>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    type="text"
                    placeholder="John"
                    required
                    invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                  />
                  {field.state.meta.isTouched && field.state.meta.errors[0] && (
                    <p className="text-[10.5px] text-coral-deep">{String(field.state.meta.errors[0]?.message ?? field.state.meta.errors[0])}</p>
                  )}
                </Fg>
              )}
            />
            <form.Field
              name="lastName"
              children={field => (
                <Fg label={t("users.detail.fields.lastName")} htmlFor={field.name} req>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    type="text"
                    placeholder="Doe"
                    required
                    invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                  />
                  {field.state.meta.isTouched && field.state.meta.errors[0] && (
                    <p className="text-[10.5px] text-coral-deep">{String(field.state.meta.errors[0]?.message ?? field.state.meta.errors[0])}</p>
                  )}
                </Fg>
              )}
            />
            <form.Field
              name="email"
              children={field => (
                <Fg label={t("users.detail.fields.email")} htmlFor={field.name} req span2>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    type="email"
                    placeholder="user@email.com"
                    required
                    invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                  />
                  {field.state.meta.isTouched && field.state.meta.errors[0] && (
                    <p className="text-[10.5px] text-coral-deep">{String(field.state.meta.errors[0]?.message ?? field.state.meta.errors[0])}</p>
                  )}
                </Fg>
              )}
            />
          </FieldGrid>
        </div>

        <form.Subscribe
          selector={state => [state.canSubmit, state.isSubmitting, state.isDefaultValue]}
          children={([canSubmit, isSubmitting, isDefaultValue]) => (
            <SecFoot note={t("users.detail.sections.edit.note")}>
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
                        <Save className="size-3.5" />
                        {isDefaultValue ? t("form.noChanges") : t("actions.save")}
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

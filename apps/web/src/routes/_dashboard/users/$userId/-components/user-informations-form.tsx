import type { z } from "zod";

import { useForm } from "@tanstack/react-form";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateUser } from "@/hooks/users/use-update-user";
import { useUser } from "@/hooks/users/use-user";
import { Button } from "~react/components/button";
import { Field, FieldContent, FieldError, FieldLabel } from "~react/components/field";
import { Input } from "~react/components/input";
import { Separator } from "~react/components/separator";
import { Spinner } from "~react/components/spinner";
import { UpdateAccountSchema } from "~shared/schemas/api/auth.schemas";

export function UserInformationsForm({ userId }: { userId: string }) {
  const { t } = useTranslation(["common", "web"]);

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
    <div>
      <div className="px-6 py-5">
        <h3 className="font-bold leading-none">{t("web:pages.users.detail.sections.edit.title")}</h3>
        <p className="text-muted-foreground text-sm mt-1.5">{t("web:pages.users.detail.sections.edit.description")}</p>
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
            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="firstName"
                children={field => (
                  <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                    <FieldLabel htmlFor={field.name}>
                      First Name
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)}
                        type="text"
                        placeholder="John"
                        required
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </FieldContent>
                  </Field>
                )}
              />
              <form.Field
                name="lastName"
                children={field => (
                  <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                    <FieldLabel htmlFor={field.name}>
                      Last Name
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)}
                        type="text"
                        placeholder="Doe"
                        required
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </FieldContent>
                  </Field>
                )}
              />
            </div>
            <form.Field
              name="email"
              children={field => (
                <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("web:pages.users.detail.fields.email")}
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={e => field.handleChange(e.target.value)}
                      type="email"
                      placeholder="user@email.com"
                      required
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
                    : isDefaultValue
                      ? t("common:form.noChanges")
                      : t("common:form.save")}
                </Button>
              )}
            />
          </div>
        </form>
      </div>
    </div>
  );
}

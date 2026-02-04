import type { User } from "~shared/types/db/users.types";
import type { z } from "zod";

import { useForm } from "@tanstack/react-form";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateUser } from "@/hooks/users/use-update-user";
import { useUser } from "@/hooks/users/use-user";
import { Button } from "~react/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~react/components/card";
import { Field, FieldContent, FieldError, FieldLabel } from "~react/components/field";
import { Input } from "~react/components/input";
import { Separator } from "~react/components/separator";
import { Spinner } from "~react/components/spinner";
import { UpdateAccountSchema } from "~shared/schemas/api/auth.schemas";

export function UserInformationsForm({ user }: { user: User }) {
  const { t } = useTranslation(["common", "web"]);

  const userQuery = useUser(user.id);

  const formRef = useRef<{ reset: (values: z.infer<typeof UpdateAccountSchema>) => void } | null>(null);

  const mutation = useUpdateUser();

  const handleSuccess = (response: { user: { name: string; email: string } }) => {
    formRef.current?.reset({ name: response.user.name, email: response.user.email });
  };

  const form = useForm({
    validators: { onChange: UpdateAccountSchema },
    defaultValues: {
      name: userQuery.data?.user.name || "",
      email: userQuery.data?.user.email || "",
    },
    onSubmit: async ({ value }) => {
      const response = await mutation.mutateAsync({ id: user.id, data: value });
      handleSuccess(response);
    },
  });

  formRef.current = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("web:pages.users.detail.sections.edit.title")}</CardTitle>
        <CardDescription>{t("web:pages.users.detail.sections.edit.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit(e);
          }}
        >
          <div className="grid gap-4">
            <form.Field
              name="name"
              children={field => (
                <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("web:pages.users.detail.fields.name")}
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={e => field.handleChange(e.target.value)}
                      type="text"
                      placeholder="User name"
                      required
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            />
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
      </CardContent>
    </Card>
  );
}

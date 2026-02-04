import type { z } from "zod";

import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarIcon, MailIcon, ShieldIcon } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { AvatarUser } from "@/components/avatar-user";
import { useUpdateAccount } from "@/hooks/users/use-update-account";
import { Badge } from "~react/components/badge";
import { Button } from "~react/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~react/components/card";
import { Field, FieldContent, FieldError, FieldLabel } from "~react/components/field";
import { Input } from "~react/components/input";
import { Separator } from "~react/components/separator";
import { Spinner } from "~react/components/spinner";
import { useAuth } from "~react/hooks/use-auth";
import { UpdateAccountSchema } from "~shared/schemas/api/auth.schemas";

export const Route = createFileRoute("/_dashboard/account/")({
  component: Account,
  staticData: { crumb: "pages.account.title" },
});

type UpdateAccountData = z.infer<typeof UpdateAccountSchema>;

function Account() {
  const { t } = useTranslation(["common", "web"]);
  const { user } = useAuth();

  const formRef = useRef<{ reset: (values: UpdateAccountData) => void } | null>(null);

  const mutation = useUpdateAccount();

  const handleSuccess = (response: { user: { name: string; email: string } }) => {
    formRef.current?.reset({ name: response.user.name, email: response.user.email });
  };

  const form = useForm({
    validators: { onChange: UpdateAccountSchema },
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
    },
    onSubmit: async ({ value }) => {
      const response = await mutation.mutateAsync(value);
      handleSuccess(response);
    },
  });

  formRef.current = form;

  return (
    <div className="w-full p-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t("web:pages.account.title")}</h1>
          <p className="text-muted-foreground">{t("web:pages.account.subtitle")}</p>
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-4">
            <AvatarUser avatar={user.avatar} name={user.name} size="lg" />
            <div className="flex-1">
              <CardTitle>{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MailIcon className="size-3" />
                {user.email}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="size-4" />
                <span>
                  {t("web:pages.account.joinedAt", { date: new Date(user.createdAt) })}
                </span>
              </div>
              {user.verifiedAt && (
                <Badge variant="secondary">Verified</Badge>
              )}
            </div>

            {user.roles && user.roles.length > 0 && (
              <div className="flex items-center gap-2">
                <ShieldIcon className="size-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {user.roles.map(role => (
                    <Badge key={role.id} variant={role.isDefault ? "outline" : "secondary"}>
                      {role.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("web:pages.account.sections.profile.title")}</CardTitle>
            <CardDescription>{t("web:pages.account.sections.profile.description")}</CardDescription>
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
                        {t("web:pages.account.fields.name")}
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={e => field.handleChange(e.target.value)}
                          type="text"
                          placeholder="Your name"
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
                        {t("web:pages.account.fields.email")}
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={e => field.handleChange(e.target.value)}
                          type="email"
                          placeholder="your@email.com"
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
      </div>
    </div>
  );
}

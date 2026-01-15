import type { FormEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Box } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { validateInvitationQueryOptions } from "@/queries/invitations";
import { Button } from "~react/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~react/components/card";
import { Field, FieldContent, FieldError, FieldLabel } from "~react/components/field";
import { Input } from "~react/components/input";
import { PasswordInput } from "~react/components/password-input";
import { Spinner } from "~react/components/spinner";
import { api } from "~react/lib/http";
import { passwordChecks, passwordRules } from "~shared/schemas/api/auth.schemas";
import { AcceptInvitationSchema } from "~shared/schemas/api/invitations.schemas";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/accept-invitation")({
  validateSearch: searchSchema,
  component: AcceptInvitation,
});

function AcceptInvitation() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { token } = Route.useSearch();

  const { data, isPending, error } = useQuery({
    ...validateInvitationQueryOptions(token || ""),
    enabled: !!token,
  });

  const form = useForm({
    validators: {
      onSubmit: AcceptInvitationSchema.omit({ token: true }),
    },
    defaultValues: {
      name: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const res = await api.invitations.accept.$post({
        json: { token: token!, ...value },
      });

      const json = await res.json();

      if (json.success) {
        toast.success("Account created successfully!");
        return navigate({ to: "/", replace: true });
      }

      throw toast.error(typeof json.error === "string" ? json.error : "Failed to create account");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    form.handleSubmit();
  }

  if (!token) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-xl flex-col gap-8">
          <a href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Box className="size-4" />
            </div>
            {t("core.name")}
          </a>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Invalid Link</CardTitle>
              <CardDescription>
                This invitation link is invalid. Please check the link and try again.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <Spinner />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-xl flex-col gap-8">
          <a href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Box className="size-4" />
            </div>
            {t("core.name")}
          </a>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Invitation Invalid</CardTitle>
              <CardDescription>
                {error?.message || "This invitation is no longer valid."}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-xl flex-col gap-8">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Box className="size-4" />
          </div>
          {t("core.name")}
        </a>
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Accept Invitation</CardTitle>
            <CardDescription>
              You've been invited to join. Create your account to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              onKeyDown={e => e.key === "Enter" && e.currentTarget.requestSubmit()}
            >
              <div className="grid gap-6">
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <FieldContent>
                    <Input value={data.invitation.email} disabled />
                  </FieldContent>
                </Field>

                <form.Field
                  name="name"
                  children={field => (
                    <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                      <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                      <FieldContent>
                        <Input
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={e => field.handleChange(e.target.value)}
                          placeholder="Your name"
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </FieldContent>
                    </Field>
                  )}
                />

                <form.Field
                  name="password"
                  children={field => (
                    <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
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
                              Creating Account...
                            </span>
                          )
                        : "Create Account"}
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

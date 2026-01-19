import type { FormEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircleIcon, BoxIcon, LinkIcon, MailIcon, UserIcon, UserPlusIcon } from "lucide-react";
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

  // Invalid link - no token provided
  if (!token) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
        <div className="flex w-full max-w-md flex-col gap-8">
          <a href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BoxIcon className="size-4" />
            </div>
            {t("core.name")}
          </a>
          <Card>
            <CardHeader className="pb-4 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
                <LinkIcon className="size-6 text-destructive" />
              </div>
              <CardTitle>Invalid Link</CardTitle>
              <CardDescription className="mt-2">
                This invitation link appears to be incomplete or malformed. Please check that you copied the entire URL.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <a href="/">Return to Home</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (isPending) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
        <div className="flex w-full max-w-md flex-col gap-8">
          <a href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BoxIcon className="size-4" />
            </div>
            {t("core.name")}
          </a>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Spinner className="size-8" />
              <p className="mt-4 text-sm text-muted-foreground">Validating invitation...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state - invitation invalid or expired
  if (error || !data?.success) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
        <div className="flex w-full max-w-md flex-col gap-8">
          <a href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BoxIcon className="size-4" />
            </div>
            {t("core.name")}
          </a>
          <Card>
            <CardHeader className="pb-4 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-500/10">
                <AlertCircleIcon className="size-6 text-amber-500" />
              </div>
              <CardTitle>Invitation Expired</CardTitle>
              <CardDescription className="mt-2">
                {error?.message || "This invitation has expired or has already been used. Please request a new invitation from your administrator."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <a href="/">Return to Home</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success - show the form
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-8">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BoxIcon className="size-4" />
          </div>
          {t("core.name")}
        </a>
        <Card>
          <CardHeader className="pb-4 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <UserPlusIcon className="size-6 text-primary" />
            </div>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription className="mt-2">
              You've been invited to join. Complete your profile to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              onKeyDown={e => e.key === "Enter" && e.currentTarget.requestSubmit()}
            >
              <div className="grid gap-5">
                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <MailIcon className="size-4 text-muted-foreground" />
                    Email
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      value={data.invitation.email}
                      disabled
                      className="bg-muted"
                    />
                  </FieldContent>
                </Field>

                <form.Field
                  name="name"
                  children={field => (
                    <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                      <FieldLabel htmlFor={field.name} className="flex items-center gap-2">
                        <UserIcon className="size-4 text-muted-foreground" />
                        Full Name
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={e => field.handleChange(e.target.value)}
                          placeholder="Enter your name"
                          className="h-11"
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
                          className="h-11"
                        />
                      </FieldContent>
                    </Field>
                  )}
                />

                <form.Subscribe
                  selector={state => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, isSubmitting]) => (
                    <Button type="submit" disabled={!canSubmit} className="mt-2 h-11">
                      {isSubmitting ? (
                        <>
                          <Spinner />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <UserPlusIcon />
                          <span>Create Account</span>
                        </>
                      )}
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

import type { FormEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircleIcon, BoxIcon, LinkIcon, UserPlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { validateInvitationQueryOptions } from "@/api/invitations/invitations.queries";
import { useAcceptInvitation } from "@/hooks/invitations/use-accept-invitation";
import { Card, CardContent } from "~react/components/card";
import { Button } from "~react/components/button";
import { Field, FieldContent, FieldError, FieldLabel } from "~react/components/field";
import { Input } from "~react/components/input";
import { PasswordInput } from "~react/components/password-input";
import { Spinner } from "~react/components/spinner";
import { passwordChecks, passwordRules } from "~shared/schemas/api/auth.schemas";
import { AcceptInvitationSchema } from "~shared/schemas/api/invitations.schemas";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/accept-invitation")({
  validateSearch: searchSchema,
  component: AcceptInvitation,
});

function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation("common");

  return (
    <div className="min-h-svh flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12 bg-panel-auth">
        <div className="absolute inset-0 pointer-events-none auth-grid" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none bg-panel-accent opacity-[0.15]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="size-9 rounded-xl flex items-center justify-center bg-panel-accent">
            <BoxIcon className="size-5 text-white" />
          </div>
          <span className="text-xl font-bold text-panel-heading">
            {t("core.name")}
            .
          </span>
        </div>

        <div className="relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-panel-accent/18 text-panel-accent">
            <span className="size-1.5 rounded-full bg-current inline-block" />
            You've been invited
          </div>
          <h2 className="text-[2.6rem] font-extrabold leading-[1.1] text-panel-heading">
            Join the
            <br />
            team today.
          </h2>
          <p className="text-base leading-relaxed max-w-xs text-panel-meta">
            Complete your account setup and start collaborating right away.
          </p>
        </div>
      </div>

      {/* Right content area */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-8">
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
            <BoxIcon className="size-4" />
          </div>
          <span className="font-bold text-lg">
            {t("core.name")}
            .
          </span>
        </div>
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

function AcceptInvitation() {
  const { token } = Route.useSearch();

  const { data, isPending, error } = useQuery({
    ...validateInvitationQueryOptions(token ?? ""),
    enabled: !!token,
  });

  const acceptMutation = useAcceptInvitation();

  const form = useForm({
    validators: {
      onSubmit: AcceptInvitationSchema.omit({ token: true }),
    },
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await acceptMutation.mutateAsync({ token: token!, ...value });
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    form.handleSubmit();
  }

  // Invalid link
  if (!token) {
    return (
      <AuthShell>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-5 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-destructive/10">
              <LinkIcon className="size-5 text-destructive" />
            </div>
            <h3 className="text-xl font-bold">Invalid Link</h3>
            <p className="text-muted-foreground text-sm mt-1.5">
              This invitation link appears to be incomplete. Please check that you copied the entire URL.
            </p>
          </div>
          <div className="px-6 py-5 border-t border-border">
            <Button asChild variant="outline" className="w-full">
              <a href="/">Return to Home</a>
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  // Loading
  if (isPending) {
    return (
      <AuthShell>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-14 flex flex-col items-center justify-center">
            <Spinner className="size-7" />
            <p className="mt-4 text-sm text-muted-foreground">Validating invitation...</p>
          </div>
        </div>
      </AuthShell>
    );
  }

  // Expired / invalid
  if (error || !data?.success) {
    return (
      <AuthShell>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-5 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10">
              <AlertCircleIcon className="size-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Invitation Expired</h3>
            <p className="text-muted-foreground text-sm mt-1.5">
              {error?.message ?? "This invitation has expired or has already been used. Please request a new one."}
            </p>
          </div>
          <div className="px-6 py-5 border-t border-border">
            <Button asChild variant="outline" className="w-full">
              <a href="/">Return to Home</a>
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  // Form
  return (
    <AuthShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete your profile to get started.</p>
        </div>

        <Card className="rounded-xl border border-border overflow-hidden">
          <CardContent>
            <form
              onSubmit={handleSubmit}
              onKeyDown={e => e.key === "Enter" && e.currentTarget.requestSubmit()}
            >
              <div className="grid gap-5">
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <FieldContent>
                    <Input value={data.invitation.email} disabled className="bg-muted" />
                  </FieldContent>
                </Field>

                <div className="grid grid-cols-2 gap-5">
                  <form.Field
                    name="firstName"
                    children={field => (
                      <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                        <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
                        <FieldContent>
                          <Input
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={e => field.handleChange(e.target.value)}
                            placeholder="John"
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
                        <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
                        <FieldContent>
                          <Input
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={e => field.handleChange(e.target.value)}
                            placeholder="Doe"
                          />
                          <FieldError errors={field.state.meta.errors} />
                        </FieldContent>
                      </Field>
                    )}
                  />
                </div>

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
                    <Button type="submit" disabled={!canSubmit} className="w-full">
                      {isSubmitting
                        ? (
                            <>
                              <Spinner />
                              <span>Creating Account...</span>
                            </>
                          )
                        : (
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
    </AuthShell>
  );
}

import type { FormEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { validateInvitationQueryOptions } from "@/api/invitations/invitations.queries";
import { Fg, FieldGrid } from "@/components/form-kit";
import { PasswordInput } from "@/components/password-input";
import { useAcceptInvitation } from "@/hooks/invitations/use-accept-invitation";
import { useBranding } from "@/providers/branding-provider";
import { Button } from "~orbit/components/ui/Button";
import { Box, Link as LinkIcon, Loader2, TriangleAlert, UserPlus } from "~orbit/components/ui/icons";
import { Input } from "~orbit/components/ui/Input";
import { Panel } from "~orbit/components/ui/Panel";
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
  const branding = useBranding();

  return (
    <div className="flex min-h-svh">
      {/* Left decorative panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex lg:w-[45%]">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-accent shadow-soft">
            {branding.logoUrl
              ? <img src={branding.logoUrl} className="size-9 object-cover" alt={branding.appName} />
              : <Box className="size-5 text-white" />}
          </div>
          <span className="text-xl font-bold text-paper">{branding.appName}</span>
        </div>

        <div className="relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-paper/70">
            <span className="size-1.5 rounded-full bg-accent" />
            {branding.appName}
          </div>
          <h2 className="text-sheen text-[2.6rem] font-extrabold leading-[1.1] tracking-[-0.03em]">
            Rejoignez l'équipe.
          </h2>
          <p className="max-w-xs text-base/relaxed text-paper/55">
            Finalisez la configuration de votre compte pour commencer.
          </p>
        </div>
      </div>

      {/* Right content area */}
      <div className="flex flex-1 flex-col items-center justify-center bg-paper p-8">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex size-7 items-center justify-center overflow-hidden rounded-lg bg-accent text-white">
            {branding.logoUrl
              ? <img src={branding.logoUrl} className="size-7 object-cover" alt={branding.appName} />
              : <Box className="size-4" />}
          </div>
          <span className="text-lg font-bold text-ink">{branding.appName}</span>
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
        <Panel>
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-coral-soft">
              <LinkIcon className="size-5 text-coral-deep" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-ink">Invalid Link</h3>
            <p className="mt-1.5 text-sm text-muted">
              This invitation link appears to be incomplete. Please check that you copied the entire URL.
            </p>
          </div>
          <div className="border-t border-line p-5">
            <Button asChild className="w-full justify-center">
              <a href="/">Return to Home</a>
            </Button>
          </div>
        </Panel>
      </AuthShell>
    );
  }

  // Loading
  if (isPending) {
    return (
      <AuthShell>
        <Panel>
          <div className="flex flex-col items-center justify-center px-6 py-14">
            <Loader2 className="size-7 animate-spin text-muted" />
            <p className="mt-4 text-sm text-muted">Validating invitation...</p>
          </div>
        </Panel>
      </AuthShell>
    );
  }

  // Expired / invalid
  if (error || !data?.success) {
    return (
      <AuthShell>
        <Panel>
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-amber-soft">
              <TriangleAlert className="size-5 text-amber-deep" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-ink">Invitation Expired</h3>
            <p className="mt-1.5 text-sm text-muted">
              {error?.message ?? "This invitation has expired or has already been used. Please request a new one."}
            </p>
          </div>
          <div className="border-t border-line p-5">
            <Button asChild className="w-full justify-center">
              <a href="/">Return to Home</a>
            </Button>
          </div>
        </Panel>
      </AuthShell>
    );
  }

  // Form
  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-muted">Complete your profile to get started.</p>
        </div>

        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit}
          onKeyDown={e => e.key === "Enter" && e.currentTarget.requestSubmit()}
        >
          <Fg label="Email">
            <Input value={data.invitation.email} disabled />
          </Fg>

          <FieldGrid>
            <form.Field
              name="firstName"
              children={field => (
                <Fg label="First name" htmlFor={field.name}>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder="John"
                    invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                  />
                </Fg>
              )}
            />
            <form.Field
              name="lastName"
              children={field => (
                <Fg label="Last name" htmlFor={field.name}>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder="Doe"
                    invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                  />
                </Fg>
              )}
            />
          </FieldGrid>

          <form.Field
            name="password"
            children={field => (
              <Fg label="Password" htmlFor={field.name}>
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

          <form.Subscribe
            selector={state => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit} className="w-full">
                {isSubmitting
                  ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Creating Account...
                      </>
                    )
                  : (
                      <>
                        <UserPlus className="size-3.5" />
                        Create Account
                      </>
                    )}
              </Button>
            )}
          />
        </form>
      </div>
    </AuthShell>
  );
}

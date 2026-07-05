import type { z } from "zod";

import { useForm } from "@tanstack/react-form";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useCreateInvitation } from "@/hooks/invitations/use-create-invitation";
import { useRoles } from "@/hooks/roles/use-roles";
import { Button } from "~orbit/components/ui/Button";
import { CheckCircle2, Copy, Loader2, Send, Shield, UserPlus } from "~orbit/components/ui/icons";
import { Input } from "~orbit/components/ui/Input";
import { Checkbox } from "~orbit/components/ui/Toggle";
import { cn } from "~orbit/lib/utils";
import { CreateInvitationSchema } from "~shared/schemas/api/invitations.schemas";

const defaultValues: z.input<typeof CreateInvitationSchema> = {
  email: "",
  roleIds: [],
  autoValidateEmail: false,
};

/** Compact single-line invitation form displayed above the invitations table. */
export function InviteUserForm() {
  const { t } = useTranslation("web");
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const rolesQuery = useRoles();

  const nonDefaultRoles = useMemo(
    () => rolesQuery.data?.roles.filter(role => !role.isDefault),
    [rolesQuery.data],
  ) ?? [];

  const mutation = useCreateInvitation();

  const form = useForm({
    validators: { onChange: CreateInvitationSchema },
    defaultValues,
    onSubmit: async ({ value }) => {
      const response = await mutation.mutateAsync({
        email: value.email,
        roleIds: value.roleIds,
        autoValidateEmail: value.autoValidateEmail,
      });

      const link = `${window.location.origin}/accept-invitation?token=${response.invitation.token}`;
      setInvitationLink(link);
      navigator.clipboard.writeText(link);
      toast.success(t("users.actions.invitationLinkCopied"));
    },
  });

  const handleDone = () => {
    form.reset();
    setInvitationLink(null);
    setCopied(false);
  };

  const handleCopyLink = async () => {
    if (invitationLink) {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      toast.success(t("users.invite.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface px-4 py-2.5 shadow-soft">
      {invitationLink
        ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-ink">
                <CheckCircle2 className="size-4 text-sage" />
                {t("users.invite.success")}
              </span>
              <Input value={invitationLink} readOnly className="h-8 w-full max-w-md font-mono text-xs" />
              <Button type="button" variant="outline" size="sm" onClick={handleCopyLink} className="shrink-0">
                {copied
                  ? (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        {t("users.invite.copied")}
                      </>
                    )
                  : (
                      <>
                        <Copy className="size-3.5" />
                        {t("users.invite.copy")}
                      </>
                    )}
              </Button>
              <Button size="sm" onClick={handleDone} className="ml-auto">
                {t("users.invite.done")}
              </Button>
            </div>
          )
        : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="flex items-center gap-x-4"
            >
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-ink">
                <UserPlus className="size-4 text-muted" />
                {t("users.invite.button")}
              </span>

              <form.Field
                name="email"
                children={field => (
                  <div className="relative w-64 shrink-0">
                    <Input
                      aria-label={t("users.invite.emailLabel")}
                      placeholder={t("users.invite.emailPlaceholder")}
                      className="h-8 text-xs"
                      value={field.state.value}
                      onChange={e => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                    />
                    {field.state.meta.isTouched && !field.state.meta.isValid && field.state.meta.errors[0]?.message && (
                      <p className="absolute left-0 top-full mt-0.5 whitespace-nowrap text-[10.5px] text-coral-deep">{t(`web:errors.${field.name}.${field.state.meta.errors[0]?.message}` as never)}</p>
                    )}
                  </div>
                )}
              />

              <form.Field
                name="roleIds"
                children={field => (
                  <div className="flex items-center gap-1.5">
                    <Shield className="size-3.5 shrink-0 text-muted" aria-label={t("users.invite.rolesLabel")} />
                    {nonDefaultRoles.length > 0
                      ? (
                          <div className="flex gap-1.5">
                            {nonDefaultRoles.map((role) => {
                              const selected = (field.state.value ?? []).includes(role.id);
                              return (
                                <button
                                  key={role.id}
                                  type="button"
                                  onClick={() => {
                                    const cur = field.state.value ?? [];
                                    field.handleChange(selected ? cur.filter(id => id !== role.id) : [...cur, role.id]);
                                  }}
                                  className={cn(
                                    "whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                                    selected ? "border-accent bg-accent-soft text-[#5a3ee0]" : "border-line bg-surface text-muted hover:bg-surface-2 hover:text-ink",
                                  )}
                                >
                                  {t(`roles.names.${role.name}`, { defaultValue: role.name })}
                                </button>
                              );
                            })}
                          </div>
                        )
                      : (
                          <span className="whitespace-nowrap text-xs text-muted">{t("users.invite.noRolesSelected")}</span>
                        )}
                  </div>
                )}
              />

              <form.Field
                name="autoValidateEmail"
                children={field => (
                  <div className="flex shrink-0 items-center whitespace-nowrap">
                    <Checkbox
                      id="autoValidateEmail"
                      checked={field.state.value}
                      onChange={checked => field.handleChange(checked)}
                      label={t("users.invite.autoValidateEmail")}
                    />
                  </div>
                )}
              />

              <form.Subscribe
                selector={state => [state.canSubmit, state.isSubmitting, state.isDirty]}
                children={([canSubmit, isSubmitting, isDirty]) => (
                  <Button type="submit" size="sm" disabled={!isDirty || !canSubmit || isSubmitting || mutation.isPending} className="ml-auto">
                    {isSubmitting || mutation.isPending
                      ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            {t("users.invite.creating")}
                          </>
                        )
                      : (
                          <>
                            <Send className="size-3.5" />
                            {t("users.invite.sendInvitation")}
                          </>
                        )}
                  </Button>
                )}
              />
            </form>
          )}
    </div>
  );
}

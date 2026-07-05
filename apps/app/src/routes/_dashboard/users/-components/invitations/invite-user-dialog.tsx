import type { z } from "zod";

import { useForm } from "@tanstack/react-form";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useCreateInvitation } from "@/hooks/invitations/use-create-invitation";
import { useRoles } from "@/hooks/roles/use-roles";
import { Button } from "~orbit/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~orbit/components/ui/Dialog";
import { CheckCircle2, Copy, Loader2, Mail, Send, Shield } from "~orbit/components/ui/icons";
import { Input } from "~orbit/components/ui/Input";
import { Checkbox } from "~orbit/components/ui/Toggle";
import { cn } from "~orbit/lib/utils";
import { CreateInvitationSchema } from "~shared/schemas/api/invitations.schemas";

const defaultValues: z.input<typeof CreateInvitationSchema> = {
  email: "",
  roleIds: [],
  autoValidateEmail: false,
};

type InviteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
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

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setInvitationLink(null);
      setCopied(false);
    }
    onOpenChange(newOpen);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("users.invite.title")}</DialogTitle>
          <DialogDescription>
            {t("users.invite.description")}
          </DialogDescription>
        </DialogHeader>

        {invitationLink
          ? (
              <div className="py-2">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="mb-4 grid size-12 place-items-center rounded-full bg-sage-soft">
                    <CheckCircle2 className="size-6 text-sage" />
                  </div>
                  <p className="text-sm font-semibold tracking-tight text-ink">{t("users.invite.success")}</p>
                  <p className="mt-1 text-sm text-muted">
                    {t("users.invite.successDescription")}
                  </p>
                </div>

                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Input value={invitationLink} readOnly className="font-mono text-xs" />
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
                  </div>

                  <p className="text-center text-xs text-muted">
                    {t("users.invite.shareDescription")}
                  </p>
                </div>

                <DialogFooter className="mt-6">
                  <Button onClick={() => handleOpenChange(false)} className="w-full">
                    {t("users.invite.done")}
                  </Button>
                </DialogFooter>
              </div>
            )
          : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <div className="flex flex-col gap-4 py-2">
                  <form.Field
                    name="email"
                    children={field => (
                      <div className="space-y-1.5">
                        <label htmlFor="invite-email" className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                          <Mail className="size-3.5" />
                          {t("users.invite.emailLabel")}
                          <span className="size-1.5 rounded-full bg-coral" />
                        </label>
                        <Input
                          id="invite-email"
                          placeholder={t("users.invite.emailPlaceholder")}
                          value={field.state.value}
                          onChange={e => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                        />
                        {field.state.meta.isTouched && !field.state.meta.isValid && field.state.meta.errors[0]?.message && (
                          <p className="text-[10.5px] text-coral-deep">{t(`web:errors.${field.name}.${field.state.meta.errors[0]?.message}` as never)}</p>
                        )}
                      </div>
                    )}
                  />

                  <form.Field
                    name="roleIds"
                    children={field => (
                      <div className="space-y-1.5">
                        <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                          <Shield className="size-3.5" />
                          {t("users.invite.rolesLabel")}
                        </span>
                        {nonDefaultRoles.length > 0
                          ? (
                              <div className="flex flex-wrap gap-1.5">
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
                                        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
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
                              <p className="text-sm text-muted">
                                {t("users.invite.noRolesSelected")}
                              </p>
                            )}
                      </div>
                    )}
                  />

                  <form.Field
                    name="autoValidateEmail"
                    children={field => (
                      <Checkbox
                        id="autoValidateEmail"
                        checked={field.state.value}
                        onChange={checked => field.handleChange(checked)}
                        label={t("users.invite.autoValidateEmail")}
                      />
                    )}
                  />
                </div>
                <DialogFooter className="mt-2">
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={mutation.isPending}>
                    {t("actions.cancel")}
                  </Button>
                  <form.Subscribe
                    selector={state => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                      <Button type="submit" disabled={!canSubmit || isSubmitting || mutation.isPending}>
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
                </DialogFooter>
              </form>
            )}
      </DialogContent>
    </Dialog>
  );
}

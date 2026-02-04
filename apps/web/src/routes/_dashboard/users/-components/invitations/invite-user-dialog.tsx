import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2Icon, CopyIcon, MailIcon, SendIcon, ShieldIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useCreateInvitation } from "@/hooks/invitations/use-create-invitation";
import { allRolesQueryOptions } from "@/api/roles/roles.queries";
import { Button } from "~react/components/button";
import { Checkbox } from "~react/components/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~react/components/dialog";
import { Field, FieldContent, FieldError, FieldLabel } from "~react/components/field";
import { Input } from "~react/components/input";
import { Label } from "~react/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~react/components/select";
import { Spinner } from "~react/components/spinner";
import { cn } from "~react/lib/utils";
import { CreateInvitationSchema } from "~shared/schemas/api/invitations.schemas";

export function InviteUserDialog() {
  const { t } = useTranslation(["common", "web"]);
  const [open, setOpen] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: rolesData } = useQuery(allRolesQueryOptions);
  const roles = rolesData?.roles ?? [];

  const mutation = useCreateInvitation();

  const form = useForm({
    validators: { onChange: CreateInvitationSchema },
    defaultValues: {
      email: "",
      roleId: undefined as number | undefined,
      autoValidateEmail: false,
    },
    onSubmit: async ({ value }) => {
      const response = await mutation.mutateAsync({
        email: value.email,
        roleId: value.roleId,
        autoValidateEmail: value.autoValidateEmail,
      });

      const link = `${window.location.origin}/accept-invitation?token=${response.invitation.token}`;
      setInvitationLink(link);
      navigator.clipboard.writeText(link);
      toast.success(t("web:pages.users.actions.invitationLinkCopied"));
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setInvitationLink(null);
      setCopied(false);
    }
    setOpen(newOpen);
  };

  const handleCopyLink = async () => {
    if (invitationLink) {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      toast.success(t("web:pages.users.invite.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <SendIcon />
          {t("web:pages.users.invite.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("web:pages.users.invite.title")}</DialogTitle>
          <DialogDescription>
            {t("web:pages.users.invite.description")}
          </DialogDescription>
        </DialogHeader>

        {invitationLink
          ? (
              <div className="py-4">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2Icon className="size-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium">{t("web:pages.users.invite.success")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("web:pages.users.invite.successDescription")}
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <Input
                      value={invitationLink}
                      readOnly
                      className="pr-20 font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLink}
                      className={cn(
                        "absolute right-1 top-1/2 -translate-y-1/2 h-7 transition-all",
                        copied && "text-emerald-500",
                      )}
                    >
                      {copied
                        ? (
                            <>
                              <CheckCircle2Icon className="size-3.5" />
                              {t("web:pages.users.invite.copied")}
                            </>
                          )
                        : (
                            <>
                              <CopyIcon className="size-3.5" />
                              {t("web:pages.users.invite.copy")}
                            </>
                          )}
                    </Button>
                  </div>

                  <p className="text-center text-xs text-muted-foreground">
                    {t("web:pages.users.invite.shareDescription")}
                  </p>
                </div>

                <DialogFooter className="mt-6">
                  <Button onClick={() => handleOpenChange(false)} className="w-full">
                    {t("web:pages.users.invite.done")}
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
                <div className="space-y-4 py-4">
                  <form.Field
                    name="email"
                    children={field => (
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <MailIcon className="size-4 text-muted-foreground" />
                          {t("web:pages.users.invite.emailLabel")}
                        </FieldLabel>
                        <FieldContent>
                          <Input
                            placeholder={t("web:pages.users.invite.emailPlaceholder")}
                            value={field.state.value}
                            onChange={e => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            className="h-11"
                          />
                        </FieldContent>
                        <FieldError errors={field.state.meta.errors}>
                          {field.state.meta.isTouched && !field.state.meta.isValid && field.state.meta.errors[0]?.message
                            ? t(`web:errors.${field.name}.${field.state.meta.errors[0]?.message}`)
                            : null}
                        </FieldError>
                      </Field>
                    )}
                  />

                  <form.Field
                    name="roleId"
                    children={field => (
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <ShieldIcon className="size-4 text-muted-foreground" />
                          {t("web:pages.users.invite.roleLabel")}
                        </FieldLabel>
                        <FieldContent>
                          <Select
                            value={field.state.value?.toString() ?? ""}
                            onValueChange={(value) => {
                              field.handleChange(value ? Number(value) : undefined);
                            }}
                          >
                            <SelectTrigger className="h-11 w-full">
                              <SelectValue placeholder={t("web:pages.users.invite.rolePlaceholder")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-muted-foreground">
                                {t("web:pages.users.invite.rolePlaceholder")}
                              </SelectItem>
                              {roles.filter(role => !role.isDefault).map(role => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldContent>
                      </Field>
                    )}
                  />

                  <form.Field
                    name="autoValidateEmail"
                    children={field => (
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="autoValidateEmail"
                          checked={field.state.value}
                          onCheckedChange={checked => field.handleChange(checked === true)}
                        />
                        <Label htmlFor="autoValidateEmail" className="cursor-pointer text-sm font-normal">
                          {t("web:pages.users.invite.autoValidateEmail")}
                        </Label>
                      </div>
                    )}
                  />
                </div>
                <DialogFooter className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={mutation.isPending}
                  >
                    {t("common:actions.cancel")}
                  </Button>
                  <form.Subscribe
                    selector={state => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                      <Button
                        type="submit"
                        disabled={!canSubmit || isSubmitting || mutation.isPending}
                      >
                        {isSubmitting || mutation.isPending
                          ? (
                              <>
                                <Spinner />
                                <span>{t("web:pages.users.invite.creating")}</span>
                              </>
                            )
                          : (
                              <>
                                <SendIcon />
                                <span>{t("web:pages.users.invite.sendInvitation")}</span>
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

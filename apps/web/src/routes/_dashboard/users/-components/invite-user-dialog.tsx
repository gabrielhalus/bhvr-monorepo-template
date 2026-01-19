import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2Icon, CopyIcon, MailIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { getInvitationsQueryOptions } from "@/queries/invitations";
import { Button } from "~react/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~react/components/dialog";
import { Field, FieldContent, FieldError, FieldLabel } from "~react/components/field";
import { Input } from "~react/components/input";
import { Spinner } from "~react/components/spinner";
import { api } from "~react/lib/http";
import { cn } from "~react/lib/utils";
import { CreateInvitationSchema } from "~shared/schemas/api/invitations.schemas";

export function InviteUserDialog() {
  const { t } = useTranslation(["common", "web"]);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await api.invitations.$post({ json: { email } });
      const data = await res.json();

      if (!res.ok) {
        const errorMessage = "error" in data
          ? (typeof data.error === "string" ? data.error : data.error?.message)
          : "Failed to create invitation";
        throw new Error(errorMessage || "Failed to create invitation");
      }

      if (!("success" in data) || !data.success || !("invitation" in data)) {
        throw new Error("Failed to create invitation");
      }

      return data.invitation;
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (invitation) => {
      const link = `${window.location.origin}/accept-invitation?token=${invitation.token}`;
      setInvitationLink(link);
      queryClient.invalidateQueries(getInvitationsQueryOptions(["invitedBy"]));

      navigator.clipboard.writeText(link);
      toast.success("Invitation link copied to clipboard");
    },
  });

  const form = useForm({
    validators: { onChange: CreateInvitationSchema },
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value.email);
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
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <SendIcon />
          Invite user
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation link to a new user. The invitation will expire in 7 days.
          </DialogDescription>
        </DialogHeader>

        {invitationLink ? (
          <div className="py-4">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2Icon className="size-6 text-emerald-500" />
              </div>
              <p className="text-sm font-medium">Invitation Created</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The link has been copied to your clipboard
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
                  {copied ? (
                    <>
                      <CheckCircle2Icon className="size-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <CopyIcon className="size-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Share this link with the user to complete their registration
              </p>
            </div>

            <DialogFooter className="mt-6">
              <Button onClick={() => handleOpenChange(false)} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="py-4">
              <form.Field
                name="email"
                children={field => (
                  <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                    <FieldLabel className="flex items-center gap-2">
                      <MailIcon className="size-4 text-muted-foreground" />
                      Email Address
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        value={field.state.value}
                        onChange={e => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="h-11"
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </FieldContent>
                  </Field>
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
                    {isSubmitting || mutation.isPending ? (
                      <>
                        <Spinner />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <SendIcon />
                        <span>Send Invitation</span>
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

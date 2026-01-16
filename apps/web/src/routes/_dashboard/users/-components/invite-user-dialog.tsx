import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Plus } from "lucide-react";
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
      toast.success("Invitation linked copied to clipboard");
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
          <Plus />
          Add invitation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation link to a new user. The invitation will expire in 7 days.
          </DialogDescription>
        </DialogHeader>

        {invitationLink
          ? (
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Invitation created! Copy the link below and share it with the user.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={invitationLink}
                    readOnly
                    className="flex-1 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={() => handleOpenChange(false)}>Done</Button>
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
                      <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                        <FieldLabel>Email Address</FieldLabel>
                        <FieldContent>
                          <Input
                            type="email"
                            placeholder="user@example.com"
                            value={field.state.value}
                            onChange={e => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                          />
                          <FieldError errors={field.state.meta.errors} />
                        </FieldContent>
                      </Field>
                    )}
                  />
                </div>
                <DialogFooter>
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
                              <span className="flex items-center space-x-2">
                                <Spinner />
                                <span>Creating...</span>
                              </span>
                            )
                          : (
                              "Create Invitation"
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

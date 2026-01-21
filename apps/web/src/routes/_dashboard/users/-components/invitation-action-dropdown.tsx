import type { Row } from "@tanstack/react-table";
import type { InvitationWithRelations } from "~shared/types/db/invitations.types";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Copy, Link, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { getInvitationsQueryOptions } from "@/queries/invitations";
import { Button } from "~react/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~react/components/dropdown-menu";
import { Spinner } from "~react/components/spinner";
import { api } from "~react/lib/http";
import sayno from "~react/lib/sayno";

export function InvitationActionDropdown({ row: { original: invitation } }: { row: Row<InvitationWithRelations<["invitedBy"]>> }) {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.invitations[":id"].$put({ param: { id } });

      if (!res.ok) {
        throw new Error(t("pages.users.actions.revokeInvitationError"));
      }

      return res.json();
    },
    onError: () => toast.error(t("pages.users.actions.revokeInvitationError")),
    onSuccess: () => {
      toast.success(t("pages.users.actions.revokeInvitationSuccess"));
      queryClient.invalidateQueries(getInvitationsQueryOptions(["invitedBy"]));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.invitations[":id"].$delete({ param: { id } });

      if (!res.ok) {
        throw new Error(t("pages.users.actions.deleteInvitationError"));
      }
      return res.json();
    },
    onError: () => toast.error(t("pages.users.actions.deleteInvitationError")),
    onSuccess: () => {
      toast.success(t("pages.users.actions.deleteInvitationSuccess"));
      queryClient.invalidateQueries(getInvitationsQueryOptions(["invitedBy"]));
    },
  });

  const handleCopyLink = () => {
    const link = `${window.location.origin}/accept-invitation?token=${invitation.token}`;
    navigator.clipboard.writeText(link);
    toast.success(t("pages.users.actions.invitationLinkCopied"));
  };

  const handleRevokeClick = async () => {
    const confirmation = await sayno.confirm({
      title: t("pages.users.actions.revokeInvitation"),
      description: t("pages.users.actions.revokeInvitationConfirm"),
      variant: "destructive",
    });

    if (confirmation) {
      revokeMutation.mutate(invitation.id);
    }
  };

  const handleDeleteClick = async () => {
    const confirmation = await sayno.confirm({
      title: t("pages.users.actions.deleteInvitation"),
      description: t("pages.users.actions.deleteInvitationConfirm"),
      variant: "destructive",
    });

    if (confirmation) {
      deleteMutation.mutate(invitation.id);
    }
  };

  const isPending = invitation.status === "pending";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">{t("pages.users.actions.openMenu")}</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("pages.users.actions.actionsLabel")}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(invitation.id)}>
          <Copy className="size-4" />
          {t("pages.users.actions.copyId")}
        </DropdownMenuItem>
        {isPending && (
          <>
            <DropdownMenuItem onClick={handleCopyLink}>
              <Link />
              {t("pages.users.actions.copyInvitationLink")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={revokeMutation.isPending}
              onClick={handleRevokeClick}
              variant="destructive"
            >
              {revokeMutation.isPending ? <Spinner /> : <Ban /> }
              {t("pages.users.actions.revokeInvitation")}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem
          disabled={deleteMutation.isPending}
          onClick={handleDeleteClick}
          variant="destructive"
        >
          {deleteMutation.isPending ? <Spinner /> : <Trash2 /> }
          {t("pages.users.actions.deleteInvitation")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

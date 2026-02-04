import type { Row } from "@tanstack/react-table";

import { Ban, Copy, Link, MoreHorizontal, Trash2 } from "lucide-react";

import type { InvitationRow } from "./invitations.data-table";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useDeleteInvitation } from "@/hooks/invitations/use-delete-invitation";
import { useRevokeInvitation } from "@/hooks/invitations/use-revoke-invitation";
import { Button } from "~react/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~react/components/dropdown-menu";
import { Spinner } from "~react/components/spinner";
import sayno from "~react/lib/sayno";

export function InvitationActionDropdown({ row: { original: invitation } }: { row: Row<InvitationRow> }) {
  const { t } = useTranslation("web");

  const revokeMutation = useRevokeInvitation();
  const deleteMutation = useDeleteInvitation();

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

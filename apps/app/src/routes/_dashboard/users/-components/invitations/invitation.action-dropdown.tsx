import type { InvitationRow } from "./invitations.data-table";
import type { Row } from "@tanstack/react-table";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useDeleteInvitation } from "@/hooks/invitations/use-delete-invitation";
import { useRevokeInvitation } from "@/hooks/invitations/use-revoke-invitation";
import sayno from "@/lib/sayno";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~orbit/components/ui/DropdownMenu";
import { Ban, Copy, Link, Loader2, MoreHorizontal, Trash2 } from "~orbit/components/ui/icons";

export function InvitationActionDropdown({ row: { original: invitation } }: { row: Row<InvitationRow> }) {
  const { t } = useTranslation("web");

  const revokeMutation = useRevokeInvitation();
  const deleteMutation = useDeleteInvitation();

  const handleCopyLink = () => {
    const link = `${window.location.origin}/accept-invitation?token=${invitation.token}`;
    navigator.clipboard.writeText(link);
    toast.success(t("users.actions.invitationLinkCopied"));
  };

  const handleRevokeClick = async () => {
    const confirmation = await sayno.confirm({
      title: t("users.actions.revokeInvitation"),
      description: t("users.actions.revokeInvitationConfirm"),
      variant: "destructive",
    });

    if (confirmation) {
      revokeMutation.mutate(invitation.id);
    }
  };

  const handleDeleteClick = async () => {
    const confirmation = await sayno.confirm({
      title: t("users.actions.deleteInvitation"),
      description: t("users.actions.deleteInvitationConfirm"),
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
        <button type="button" className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink">
          <span className="sr-only">{t("users.actions.openMenu")}</span>
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("users.actions.actionsLabel")}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(invitation.id)}>
          <Copy className="size-4" />
          {t("users.actions.copyId")}
        </DropdownMenuItem>
        {isPending && (
          <>
            <DropdownMenuItem onClick={handleCopyLink}>
              <Link className="size-4" />
              {t("users.actions.copyInvitationLink")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={revokeMutation.isPending}
              onClick={handleRevokeClick}
              variant="danger"
            >
              {revokeMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
              {t("users.actions.revokeInvitation")}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem
          disabled={deleteMutation.isPending}
          onClick={handleDeleteClick}
          variant="danger"
        >
          {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          {t("users.actions.deleteInvitation")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

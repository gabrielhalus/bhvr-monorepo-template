import type { Row } from "@tanstack/react-table";
import type { InvitationWithRelations } from "~shared/types/db/invitations.types";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Link, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { getInvitationsQueryOptions } from "@/queries/invitations";
import { Button } from "~react/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~react/components/dropdown-menu";
import { api } from "~react/lib/http";
import sayno from "~react/lib/sayno";

export function InvitationActionDropdown({ row: { original: invitation } }: { row: Row<InvitationWithRelations<["invitedBy"]>> }) {
  const queryClient = useQueryClient();

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.invitations[":id"].$put({ param: { id } });

      if (!res.ok) {
        throw new Error("Failed to revoke invitation");
      }

      return res.json();
    },
    onError: () => toast.error("Failed to revoke invitation"),
    onSuccess: () => {
      toast.success("Invitation revoked successfully");
      queryClient.invalidateQueries(getInvitationsQueryOptions(["invitedBy"]));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.invitations[":id"].$delete({ param: { id } });

      if (!res.ok) {
        throw new Error("Failed to delete invitation");
      }
      return res.json();
    },
    onError: () => toast.error("Failed to delete invitation"),
    onSuccess: () => {
      toast.success("Invitation deleted successfully");
      queryClient.invalidateQueries(getInvitationsQueryOptions(["invitedBy"]));
    },
  });

  const handleCopyLink = () => {
    const link = `${window.location.origin}/accept-invitation?token=${invitation.token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invitation link copied to clipboard");
  };

  const handleRevokeClick = async () => {
    const confirmation = await sayno({
      title: "Revoke Invitation",
      description: "Are you sure you want to revoke this invitation? The user will no longer be able to use this link.",
      variant: "destructive",
    });

    if (confirmation) {
      revokeMutation.mutate(invitation.id);
    }
  };

  const handleDeleteClick = async () => {
    const confirmation = await sayno({
      title: "Delete Invitation",
      description: "Are you sure you want to delete this invitation? The user will no longer be able to use this link.",
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
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(invitation.id)}>
          <Copy className="size-4" />
          Copy ID
        </DropdownMenuItem>
        {isPending && (
          <>
            <DropdownMenuItem onClick={handleCopyLink}>
              <Link className="size-4" />
              Copy Invitation Link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleRevokeClick}>
              Revoke Invitation
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem variant="destructive" onClick={handleDeleteClick}>
          Delete Invitation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import type { Row } from "@tanstack/react-table";
import type { InvitationWithRelations } from "~shared/types/db/invitations.types";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Link, MoreHorizontal, X } from "lucide-react";
import { toast } from "sonner";

import { getInvitationsQueryOptions } from "@/queries/invitations";
import { Button } from "~react/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~react/components/dropdown-menu";
import { Spinner } from "~react/components/spinner";
import { api } from "~react/lib/http";
import sayno from "~react/lib/sayno";

export function ActionDropdown({ row: { original: invitation } }: { row: Row<InvitationWithRelations<["invitedBy"]>> }) {
  const queryClient = useQueryClient();

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.invitations[":id"].$delete({ param: { id } });

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
            <Button
              disabled={revokeMutation.isPending}
              onClick={handleRevokeClick}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              {revokeMutation.isPending ? <Spinner /> : <X className="size-4" />}
              Revoke
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

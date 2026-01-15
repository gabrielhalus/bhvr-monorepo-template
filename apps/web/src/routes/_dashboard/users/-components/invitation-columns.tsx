import type { ColumnDef } from "@tanstack/react-table";
import type { InvitationWithRelations } from "~shared/types/db/invitations.types";

import { Badge } from "~react/components/badge";
import { SortableHeader } from "~react/components/sortable-header";

import { InvitationActionDropdown } from "./invitation-action-dropdown";

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "default",
  accepted: "secondary",
  expired: "outline",
  revoked: "destructive",
};

export const invitationColumns: ColumnDef<InvitationWithRelations<["invitedBy"]>>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => <SortableHeader column={column} title="Email" />,
    cell: ({ row }) => <div className="font-medium">{row.original.email}</div>,
    size: 250,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={statusVariants[status] || "outline"} className="capitalize">
          {status}
        </Badge>
      );
    },
    size: 120,
  },
  {
    accessorKey: "invitedBy",
    header: "Invited By",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.original.invitedBy?.name || "Unknown"}
      </div>
    ),
    size: 150,
  },
  {
    id: "spacer",
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "expiresAt",
    header: ({ column }) => <SortableHeader column={column} title="Expires At" />,
    cell: ({ row }) => {
      const timestamp = row.original.expiresAt;
      const isExpired = new Date(timestamp) < new Date();
      const dateString = timestamp
        ? new Date(timestamp).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "";
      return (
        <div className={isExpired ? "text-destructive" : "text-muted-foreground"}>
          {dateString}
        </div>
      );
    },
    size: 150,
  },
  {
    id: "actions",
    cell: ({ row }) => <InvitationActionDropdown row={row} />,
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
];

import type { ColumnDef } from "@tanstack/react-table";
import type { InvitationWithRelations } from "~shared/types/db/invitations.types";

import { CheckCircle2Icon, ClockIcon, MailIcon, XCircleIcon } from "lucide-react";

import { AvatarUser } from "@/components/avatar-user";
import { Badge } from "~react/components/badge";
import { SortableHeader } from "~react/components/sortable-header";
import { cn } from "~react/lib/utils";

import { InvitationActionDropdown } from "./invitation-action-dropdown";

const statusConfig: Record<string, {
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> = {
  pending: { variant: "default", icon: ClockIcon, label: "Pending" },
  accepted: { variant: "secondary", icon: CheckCircle2Icon, label: "Accepted" },
  expired: { variant: "outline", icon: ClockIcon, label: "Expired" },
  revoked: { variant: "destructive", icon: XCircleIcon, label: "Revoked" },
};

export const invitationColumns: ColumnDef<InvitationWithRelations<["invitedBy"]>>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => <SortableHeader column={column} title="Email" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
          <MailIcon className="size-4 text-muted-foreground" />
        </div>
        <span className="font-medium">{row.original.email}</span>
      </div>
    ),
    size: 280,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.original.status;
      const config = statusConfig[status] ?? statusConfig.pending;
      const Icon = config?.icon ?? ClockIcon;
      return (
        <Badge variant={config.variant} className="gap-1 font-normal">
          <Icon className="size-3" />
          {config.label}
        </Badge>
      );
    },
    size: 130,
  },
  {
    accessorKey: "invitedBy",
    header: "Invited By",
    cell: ({ row }) => {
      const invitedBy = row.original.invitedBy;
      if (!invitedBy) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <div className="flex items-center gap-2">
          <AvatarUser {...invitedBy} size="sm" />
          <span className="text-sm text-muted-foreground">{invitedBy.name}</span>
        </div>
      );
    },
    size: 180,
  },
  {
    id: "spacer",
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "expiresAt",
    header: ({ column }) => <SortableHeader column={column} title="Expires" />,
    cell: ({ row }) => {
      const timestamp = row.original.expiresAt;
      const now = new Date();
      const expiresAt = new Date(timestamp);
      const isExpired = expiresAt < now;
      const isExpiringSoon = !isExpired && expiresAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000; // 24 hours

      const dateString = timestamp
        ? new Date(timestamp).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      return (
        <div
          className={cn(
            "flex items-center gap-1.5",
            isExpired && "text-destructive",
            isExpiringSoon && !isExpired && "text-amber-500",
            !isExpired && !isExpiringSoon && "text-muted-foreground",
          )}
        >
          <ClockIcon className="size-3.5" />
          <span>{dateString}</span>
        </div>
      );
    },
    size: 160,
  },
  {
    id: "actions",
    cell: ({ row }) => <InvitationActionDropdown row={row} />,
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
];

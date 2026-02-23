import type { InvitationRow } from "./invitations.data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";

import { CheckCircle2Icon, ClockIcon, MailIcon, XCircleIcon } from "lucide-react";

import { AvatarUser } from "@/components/avatar-user";
import i18n from "@/i18n";
import { Badge } from "~react/components/badge";
import { SortableHeader } from "~react/components/sortable-header";
import { cn } from "~react/lib/utils";
import { formatValue } from "~shared/i18n";
import { formatFullName } from "~react/lib/name-utils";

import { InvitationActionDropdown } from "./invitation.action-dropdown";

function getStatusConfig(t: TFunction): Record<string, {
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> {
  return {
    pending: { variant: "default", icon: ClockIcon, label: t("pages.users.status.pending") },
    accepted: { variant: "secondary", icon: CheckCircle2Icon, label: t("pages.users.status.accepted") },
    expired: { variant: "outline", icon: ClockIcon, label: t("pages.users.status.expired") },
    revoked: { variant: "destructive", icon: XCircleIcon, label: t("pages.users.status.revoked") },
  };
}

export function getInvitationColumns(t: TFunction): ColumnDef<InvitationRow>[] {
  const statusConfig = getStatusConfig(t);
  return [
    {
      accessorKey: "email",
      header: ({ column }) => <SortableHeader column={column} title={t("pages.users.columns.email")} />,
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
      header: ({ column }) => <SortableHeader column={column} title={t("pages.users.columns.status")} />,
      cell: ({ row }) => {
        const status = row.original.status;
        const config = statusConfig[status] ?? statusConfig.pending!;
        const Icon = config.icon;
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
      header: t("pages.users.columns.invitedBy"),
      cell: ({ row }) => {
        const invitedBy = row.original.invitedBy;
        if (!invitedBy) {
          return <span className="text-muted-foreground">—</span>;
        }
        const fullName = formatFullName(invitedBy.firstName, invitedBy.lastName);
        return (
          <div className="flex items-center gap-2">
            <AvatarUser avatar={invitedBy.avatar ?? ""} firstName={invitedBy.firstName} lastName={invitedBy.lastName} size="sm" />
            <span className="text-sm text-muted-foreground">{fullName}</span>
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
      header: ({ column }) => <SortableHeader column={column} title={t("pages.users.columns.expires")} />,
      cell: ({ row }) => {
        const timestamp = row.original.expiresAt;
        const now = new Date();
        const expiresAt = new Date(timestamp);
        const isExpired = expiresAt < now;
        const isExpiringSoon = !isExpired && expiresAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000;

        const dateString = formatValue(expiresAt, { locale: i18n.language, format: "datetime" });

        if (row.original.status !== "pending") {
          return <div className="text-muted-foreground">-</div>;
        }

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
      accessorKey: "acceptedAt",
      header: ({ column }) => <SortableHeader column={column} title={t("pages.users.columns.accepted")} />,
      cell: ({ row }) => {
        if (row.original.status !== "accepted") {
          return <div className="text-muted-foreground">-</div>;
        }

        const timestamp = row.original.acceptedAt;
        const acceptedAt = new Date(timestamp ?? "");

        const dateString = formatValue(acceptedAt, { locale: i18n.language, format: "datetime" });

        return (
          <div className={cn("flex items-center gap-1.5 text-muted-foreground")}>
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
}

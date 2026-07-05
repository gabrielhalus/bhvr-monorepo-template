import type { InvitationRow } from "./invitations.data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { BadgeProps } from "~orbit/components/ui/Badge";
import type { TFunction } from "i18next";

import { SortableHeader } from "@/components/data-table";
import i18n from "@/i18n";
import { Avatar } from "~orbit/components/ui/Avatar";
import { Badge } from "~orbit/components/ui/Badge";
import { CheckCircle2, Clock, Mail, XCircle } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";
import { formatValue } from "~shared/i18n";

import { InvitationActionDropdown } from "./invitation.action-dropdown";

type StatusTone = NonNullable<BadgeProps["tone"]>;

const STATUS_TONE: Record<string, StatusTone> = {
  pending: "accent",
  accepted: "sage",
  expired: "neutral",
  revoked: "coral",
};

function getStatusConfig(t: TFunction<"web">): Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> {
  return {
    pending: { icon: Clock, label: t("users.status.pending") },
    accepted: { icon: CheckCircle2, label: t("users.status.accepted") },
    expired: { icon: Clock, label: t("users.status.expired") },
    revoked: { icon: XCircle, label: t("users.status.revoked") },
  };
}

function fullName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(" ") || "—";
}

export function getInvitationColumns(t: TFunction<"web">): ColumnDef<InvitationRow>[] {
  const statusConfig = getStatusConfig(t);
  return [
    {
      accessorKey: "email",
      header: ({ column }) => <SortableHeader column={column} title={t("users.columns.email")} />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2">
            <Mail className="size-4 text-muted" />
          </div>
          <span className="font-medium text-ink">{row.original.email}</span>
        </div>
      ),
      size: 280,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column} title={t("users.columns.status")} />,
      cell: ({ row }) => {
        const status = row.original.status;
        const config = statusConfig[status] ?? statusConfig.pending!;
        const Icon = config.icon;
        return (
          <Badge tone={STATUS_TONE[status] ?? "accent"}>
            <Icon className="size-3" />
            {config.label}
          </Badge>
        );
      },
      size: 130,
    },
    {
      accessorKey: "invitedBy",
      header: t("users.columns.invitedBy"),
      cell: ({ row }) => {
        const invitedBy = row.original.invitedBy;
        if (!invitedBy) return <span className="text-muted">—</span>;
        const name = fullName(invitedBy.firstName, invitedBy.lastName);
        return (
          <div className="flex items-center gap-2">
            <Avatar size="xs" name={name} src={invitedBy.avatar ?? undefined} />
            <span className="text-sm text-muted">{name}</span>
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
      header: ({ column }) => <SortableHeader column={column} title={t("users.columns.expires")} />,
      cell: ({ row }) => {
        const now = new Date();
        const expiresAt = new Date(row.original.expiresAt);
        const isExpired = expiresAt < now;
        const isExpiringSoon = !isExpired && expiresAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000;

        const dateString = formatValue(expiresAt, { locale: i18n.language, format: "datetime" });

        if (row.original.status !== "pending") return <div className="text-muted">-</div>;

        return (
          <div
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap",
              isExpired && "text-coral-deep",
              isExpiringSoon && !isExpired && "text-amber-deep",
              !isExpired && !isExpiringSoon && "text-muted",
            )}
          >
            <Clock className="size-3.5" />
            <span>{dateString}</span>
          </div>
        );
      },
      size: 160,
    },
    {
      accessorKey: "acceptedAt",
      header: ({ column }) => <SortableHeader column={column} title={t("users.columns.accepted")} />,
      cell: ({ row }) => {
        if (row.original.status !== "accepted") return <div className="text-muted">-</div>;
        const acceptedAt = new Date(row.original.acceptedAt ?? "");
        const dateString = formatValue(acceptedAt, { locale: i18n.language, format: "datetime" });
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap text-muted">
            <Clock className="size-3.5" />
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

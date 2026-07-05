import type { ColumnDef } from "@tanstack/react-table";
import type { UserMetadata } from "~shared/schemas/db/users.schemas";
import type { UserWithRelations } from "~shared/types/db/users.types";
import type { TFunction } from "i18next";

import { Link } from "@tanstack/react-router";

import { SortableHeader } from "@/components/data-table";
import i18n from "@/i18n";
import { Avatar } from "~orbit/components/ui/Avatar";
import { Badge } from "~orbit/components/ui/Badge";
import { Calendar, Crown, Mail } from "~orbit/components/ui/icons";
import { formatValue } from "~shared/i18n";

import { ActionDropdown } from "./user.action-dropdown";

function fullName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(" ") || "—";
}

export function getUserColumns(t: TFunction<"web">, canDeleteMap: Record<string, boolean> = {}): ColumnDef<UserWithRelations<["roles"]>>[] {
  return [
    {
      id: "name",
      header: ({ column }) => <SortableHeader column={column} title={t("users.columns.name")} />,
      cell: ({ row }) => {
        const name = fullName(row.original.firstName, row.original.lastName);
        const isSystem = Boolean((row.original.metadata as UserMetadata)?.system);
        return (
          <Link
            to="/users/$userId"
            params={{ userId: encodeURIComponent(row.original.id) }}
            className="group flex items-center gap-3"
          >
            <Avatar size="sm" name={name} src={row.original.avatar ?? undefined} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-medium text-ink">
                <span className="truncate group-hover:underline">{name}</span>
                {isSystem && (
                  <Crown className="size-3.5 shrink-0 text-[#E0A800]" aria-label={t("users.systemUser")} />
                )}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-muted">
                <Mail className="size-3 shrink-0" />
                {row.original.email}
              </p>
            </div>
          </Link>
        );
      },
      size: 300,
    },
    {
      accessorKey: "roles",
      header: t("users.columns.roles"),
      cell: ({ row }) => {
        const roles = row.original.roles;
        if (!roles?.length) return <span className="text-muted">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {roles.slice(0, 3).map(role => (
              <Badge key={role.id} tone={role.isDefault ? "neutral" : "accent"}>
                {i18n.t(`roles.names.${role.name}`, { defaultValue: role.name })}
              </Badge>
            ))}
            {roles.length > 3 && <Badge tone="neutral">{`+${roles.length - 3}`}</Badge>}
          </div>
        );
      },
      size: 250,
    },
    {
      accessorKey: "verifiedAt",
      header: t("users.columns.status"),
      enableSorting: false,
      cell: ({ row }) => {
        const verified = Boolean(row.original.verifiedAt);
        return (
          <Badge tone={verified ? "sage" : "neutral"} dot>
            {verified ? t("users.verified") : t("users.unverified")}
          </Badge>
        );
      },
      size: 130,
    },
    {
      id: "spacer",
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} title={t("users.columns.joined")} />,
      cell: ({ row }) => {
        const dateString = formatValue(new Date(row.original.createdAt), { locale: i18n.language, format: "date" });
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap text-muted">
            <Calendar className="size-3.5" />
            <span>{dateString}</span>
          </div>
        );
      },
      size: 150,
    },
    {
      id: "actions",
      cell: ({ row }) => <ActionDropdown row={row} canDelete={canDeleteMap[row.original.id] ?? false} />,
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
  ];
}

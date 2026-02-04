import type { ColumnDef } from "@tanstack/react-table";
import type { UserWithRelations } from "~shared/types/db/users.types";
import type { TFunction } from "i18next";

import { Link } from "@tanstack/react-router";
import { CalendarIcon, MailIcon } from "lucide-react";

import { AvatarUser } from "@/components/avatar-user";
import i18n from "@/i18n";
import { Badge } from "~react/components/badge";
import { SortableHeader } from "~react/components/sortable-header";
import { formatValue } from "~shared/i18n";

import { ActionDropdown } from "./user.action-dropdown";

export function getUserColumns(t: TFunction): ColumnDef<UserWithRelations<["roles"]>>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title={t("pages.users.columns.name")} />,
      cell: ({ row }) => (
        <Link
          to="/users/$userId"
          params={{ userId: encodeURIComponent(row.original.id) }}
          className="group flex items-center gap-3"
        >
          <AvatarUser {...row.original} />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground group-hover:underline">
              {row.getValue("name")}
            </p>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MailIcon className="size-3 shrink-0" />
              {row.original.email}
            </p>
          </div>
        </Link>
      ),
      size: 300,
    },
    {
      accessorKey: "roles",
      header: t("pages.users.columns.roles"),
      cell: ({ row }) => {
        const roles = row.original.roles;
        if (!roles?.length) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {roles.slice(0, 3).map(role => (
              <Badge key={role.id} variant={role.isDefault ? "outline" : "secondary"} className="font-normal">
                {role.label}
              </Badge>
            ))}
            {roles.length > 3 && (
              <Badge variant="outline" className="font-normal">
                +
                {roles.length - 3}
              </Badge>
            )}
          </div>
        );
      },
      size: 250,
    },
    {
      id: "spacer",
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} title={t("pages.users.columns.joined")} />,
      cell: ({ row }) => {
        const timestamp = row.original.createdAt;
        const dateString = formatValue(new Date(timestamp), { locale: i18n.language, format: "date" });
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarIcon className="size-3.5" />
            <span>{dateString}</span>
          </div>
        );
      },
      size: 150,
    },
    {
      id: "actions",
      cell: ({ row }) => <ActionDropdown row={row} />,
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
  ];
}

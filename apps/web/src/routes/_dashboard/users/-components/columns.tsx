import type { ColumnDef } from "@tanstack/react-table";
import type { UserWithRelations } from "~shared/types/db/users.types";

import { Link } from "@tanstack/react-router";
import { CalendarIcon, MailIcon } from "lucide-react";

import { AvatarUser } from "@/components/avatar-user";
import { Badge } from "~react/components/badge";
import { SortableHeader } from "~react/components/sortable-header";

import { ActionDropdown } from "./action-dropdown";

export const columns: ColumnDef<UserWithRelations<["roles"]>>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} title="Name" />,
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
    header: "Roles",
    cell: ({ row }) => {
      const roles = row.original.roles;
      if (!roles || roles.length === 0) {
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
              +{roles.length - 3}
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
    header: ({ column }) => <SortableHeader column={column} title="Joined" />,
    cell: ({ row }) => {
      const timestamp = row.original.createdAt;
      const dateString = timestamp
        ? new Date(timestamp).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "";
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

import type { ColumnDef } from "@tanstack/react-table";
import type { RoleWithRelations } from "~shared/types/db/roles.types";

import { Link } from "@tanstack/react-router";
import { ShieldIcon, UsersIcon } from "lucide-react";

import { Badge } from "~react/components/badge";
import { SortableHeader } from "~react/components/sortable-header";
import { cn } from "~react/lib/utils";

import { ActionDropdown } from "./action-dropdown";

export const columns: ColumnDef<RoleWithRelations<["members"]>>[] = [
  {
    accessorKey: "label",
    header: ({ column }) => <SortableHeader column={column} title="Role" />,
    cell: ({ row }) => (
      <Link
        to="/roles/$name"
        params={{ name: row.original.name }}
        className="group flex items-center gap-3"
      >
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            row.original.isDefault
              ? "bg-primary/10 text-primary"
              : row.original.isSuperAdmin
                ? "bg-amber-500/10 text-amber-500"
                : "bg-muted text-muted-foreground",
          )}
        >
          <ShieldIcon className="size-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground group-hover:underline">
              {row.original.label}
            </span>
            {row.original.isDefault && (
              <Badge variant="outline" className="text-xs font-normal">
                Default
              </Badge>
            )}
            {row.original.isSuperAdmin && (
              <Badge variant="secondary" className="text-xs font-normal">
                Admin
              </Badge>
            )}
          </div>
          {row.original.description && (
            <p className="max-w-xs truncate text-xs text-muted-foreground">
              {row.original.description}
            </p>
          )}
        </div>
      </Link>
    ),
    size: 350,
  },
  {
    accessorKey: "members",
    header: ({ column }) => <SortableHeader column={column} title="Members" />,
    cell: ({ row }) => {
      const memberCount = row.original.members.length;
      const isDefault = row.original.isDefault;

      return (
        <Link
          to="/roles/$name/members"
          params={{ name: row.original.name }}
          className="group inline-flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent"
        >
          <UsersIcon className="size-4 text-muted-foreground" />
          <span className="tabular-nums">
            {isDefault ? "All users" : memberCount}
          </span>
        </Link>
      );
    },
    size: 140,
  },
  {
    id: "spacer",
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionDropdown row={row} />,
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
];

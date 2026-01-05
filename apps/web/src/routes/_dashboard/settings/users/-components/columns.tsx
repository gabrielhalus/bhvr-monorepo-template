import type { ColumnDef } from "@tanstack/react-table";
import type { UserWithRelations } from "~shared/types/db/users.types";

import { Link } from "@tanstack/react-router";

import { AvatarUser } from "@/components/avatar-user";
import { SortableHeader } from "~react/components/sortable-header";

import { ActionDropdown } from "./action-dropdown";

export const columns: ColumnDef<UserWithRelations<["roles"]>>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center space-x-3">
        <AvatarUser {...row.original} />
        <Link to="/settings/users/$userId" params={{ userId: encodeURIComponent(row.original.id) }} className="text-foreground hover:underline">{row.getValue("name")}</Link>
      </div>
    ),
    size: 250,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <SortableHeader column={column} title="Email" />,
    cell: ({ row }) => <div className="text-muted-foreground">{row.original.email}</div>,
    size: 250,
  },
  {
    accessorKey: "roles",
    header: "Roles",
    cell: ({ row }) => (
      <div className="text-muted-foreground overflow-hidden text-ellipsis">
        { row.original.roles?.map(r => r.label).join(", ") }
      </div>
    ),
    size: 200,
  },
  {
    id: "spacer",
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "verifiedAt",
    header: ({ column }) => <SortableHeader column={column} title="Verified At" />,
    cell: ({ row }) => {
      const timestamp = row.original.verifiedAt;
      const dateString = timestamp
        ? new Date(timestamp).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "";
      return <div className="text-muted-foreground">{dateString}</div>;
    },
    size: 150,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} title="Created At" />,
    cell: ({ row }) => {
      const timestamp = row.original.createdAt;
      const dateString = timestamp
        ? new Date(timestamp).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "";
      return <div className="text-muted-foreground">{dateString}</div>;
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

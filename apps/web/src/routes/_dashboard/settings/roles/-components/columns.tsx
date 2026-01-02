import type { RoleWithRelations } from "@bunstack/shared/types/db/roles.types";
import type { ColumnDef } from "@tanstack/react-table";

import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";

import { ActionDropdown } from "./action-dropdown";
import { Button } from "@bunstack/react/components/button";
import { SortableHeader } from "@bunstack/react/components/sortable-header";
import { Tooltip, TooltipContent, TooltipTrigger } from "@bunstack/react/components/tooltip";

export const columns: ColumnDef<RoleWithRelations<["members"]>>[] = [
  {
    accessorKey: "label",
    header: ({ column }) => <SortableHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <Link to="/settings/roles/$name" params={{ name: row.original.name }} className="text-foreground hover:underline">
        {row.original.label}
      </Link>
    ),
    size: 250,
  },
  {
    accessorKey: "description",
    header: "Description",
    size: 250,
  },
  {
    accessorKey: "members",
    header: ({ column }) => <SortableHeader column={column} title="Members" />,
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="sm">
            <Link to="/settings/roles/$name/members" params={{ name: row.original.name }} className="flex items-center gap-2">
              {row.original.members.length}
              <UserRound className="size-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          Show members
        </TooltipContent>
      </Tooltip>
    ),
    size: 0,
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
    size: 0,
  },
];

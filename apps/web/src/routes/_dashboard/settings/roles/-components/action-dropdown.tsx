import type { Role } from "~shared/types/db/roles.types";
import type { Row } from "@tanstack/react-table";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, MoreHorizontal, Trash } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~react/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "~react/components/dropdown-menu";
import { Spinner } from "~react/components/spinner";
import { api } from "~react/lib/http";
import sayno from "~react/lib/sayno";
import { authorizeQueryOptions } from "~react/queries/auth";

export function ActionDropdown({ row: { original: role } }: { row: Row<Role> }) {
  const queryClient = useQueryClient();

  const { data: canDelete } = useQuery(authorizeQueryOptions("role:delete", role));

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.roles[":id{[0-9]+}"].$delete({ param: { id: String(id) } });

      if (!res.ok) {
        throw new Error("Failed to delete role");
      }

      return res.json();
    },
    onError: () => toast.error("Failed to delete role"),
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.refetchQueries({ queryKey: ["get-roles-paginated"] });
    },
  });

  const handleDeleteClick = async () => {
    const confirmation = await sayno({
      title: "Delete Role",
      description: "Are you sure you want to delete this role? This action cannot be undone.",
      variant: "destructive",
    });

    if (confirmation) {
      mutation.mutate(role.id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(String(role.id))}>
          <Copy className="size-4" />
          Copy Role ID
        </DropdownMenuItem>
        {canDelete && (
          <Button
            disabled={mutation.isPending}
            onClick={handleDeleteClick}
            variant="destructive"
            size="sm"
            className="w-full"
          >
            {mutation.isPending ? <Spinner /> : <Trash className="size-4" />}
            Delete User
          </Button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

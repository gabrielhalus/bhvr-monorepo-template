import type { Role } from "@bunstack/shared/types/roles";
import type { Row } from "@tanstack/react-table";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, MoreHorizontal, Trash } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@bunstack/react/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@bunstack/react/components/dropdown-menu";
import { Spinner } from "@bunstack/react/components/spinner";
import { useAuth } from "@bunstack/react/hooks/use-auth";
import { api } from "@bunstack/react/lib/http";
import sayno from "@bunstack/react/lib/sayno";

export function ActionDropdown({ row: { original: role } }: { row: Row<Role> }) {
  const { can } = useAuth();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.roles[":id"].$delete({ param: { id: String(id) } });

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
        {can("role:delete") && (
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

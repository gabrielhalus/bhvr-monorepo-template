import type { Row } from "@tanstack/react-table";
import type { User } from "~shared/types/db/users.types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, MoreHorizontal, Trash } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~react/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "~react/components/dropdown-menu";
import { Spinner } from "~react/components/spinner";
import { api } from "~react/lib/http";
import sayno from "~react/lib/sayno";
import { authorizeQueryOptions } from "~react/queries/auth";

export function ActionDropdown({ row: { original: user } }: { row: Row<User> }) {
  const queryClient = useQueryClient();

  const { data: canDelete } = useQuery(authorizeQueryOptions("user:delete", user));

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.users[":id"].$delete({ param: { id } });

      if (!res.ok) {
        throw new Error("Failed to delete user");
      }

      return res.json();
    },
    onError: () => toast.error("Failed to delete user"),
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.refetchQueries({ queryKey: ["get-users"] });
    },
  });

  const handleDeleteClick = async () => {
    const confirmation = await sayno({
      title: "Delete User",
      description: "Are you sure you want to delete this user? This action cannot be undone.",
      variant: "destructive",
    });

    if (confirmation) {
      mutation.mutate(user.id);
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
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
          <Copy className="size-4" />
          Copy User ID
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

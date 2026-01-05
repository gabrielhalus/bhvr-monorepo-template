import type { Role } from "~shared/types/db/roles.types";
import type { User } from "~shared/types/db/users.types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { toast } from "sonner";

import { AvatarUser } from "@/components/avatar-user";
import { getRoleByNameQueryOptions } from "@/queries/roles";
import { Button } from "~react/components/button";
import { Spinner } from "~react/components/spinner";
import { api } from "~react/lib/http";
import sayno from "~react/lib/sayno";
import { authorizeQueryOptions } from "~react/queries/auth";

import { Route as Layout } from "../../route";

export function RoleMembersList({ search }: { search: string }) {
  const { role: initialRole } = Layout.useLoaderData();
  const { data } = useQuery({
    ...getRoleByNameQueryOptions(initialRole.name, ["members"]),
    initialData: {
      success: true,
      role: initialRole,
    },
  });

  const role = data?.role;
  const filteredMembers = role?.members?.filter(member =>
    member.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (!role) {
    return null;
  }

  return (
    <>
      {filteredMembers?.map(user => (
        <RoleMemberItem key={user.id} user={user} role={role} />
      ))}
    </>
  );
}

function RoleMemberItem({ user, role }: { user: User; role: Role }) {
  const queryClient = useQueryClient();

  const { data: canDelete } = useQuery(authorizeQueryOptions("role:delete", role));

  const mutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.roles[":id{[0-9]+}"].members.$delete({ param: { id: role.id.toString() }, json: { userIds: [userId] } });

      if (!res.ok) {
        throw new Error("Failed to remove user role");
      }
    },
    onError: () => toast.error("Failed to remove user role"),
    onSuccess: () => {
      toast.success("User role removed successfully");
      queryClient.invalidateQueries(getRoleByNameQueryOptions(role.name, ["members"]));
    },
  });

  async function handleRemove(user: User, event: React.MouseEvent) {
    if (!event.shiftKey) {
      const confirmation = await sayno({ title: "Retirer le membre", description: `Supprimer le rôle ${role.label} de ${user.name} ?` });

      if (!confirmation) {
        return;
      }
    }

    mutation.mutate(user.id);
  }

  return (
    <div key={user.id} className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <AvatarUser {...user} />
        <Link to="/settings/users/$userId" params={{ userId: encodeURIComponent(user.id) }} className="text-sm text-foreground hover:underline">{user.name}</Link>
      </div>
      { canDelete && (
        <Button variant="ghost" size="icon" onClick={event => handleRemove(user, event)}>
          {mutation.isPending ? <Spinner /> : <XIcon className="size-4" />}
        </Button>
      )}
    </div>
  );
}

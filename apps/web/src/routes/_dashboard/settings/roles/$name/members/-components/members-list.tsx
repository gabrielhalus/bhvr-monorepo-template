import type { Role, RoleWithRelations } from "@bunstack/shared/types/roles.types";
import type { User } from "@bunstack/shared/types/users.types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { toast } from "sonner";

import { Route as Layout } from "../../route";
import { AvatarUser } from "@/components/avatar-user";
import { getRoleByNameQueryOptions } from "@/queries/roles";
import { Button } from "@bunstack/react/components/button";
import { Spinner } from "@bunstack/react/components/spinner";
import { api } from "@bunstack/react/lib/http";
import sayno from "@bunstack/react/lib/sayno";
import { authorizeQueryOptions } from "@bunstack/react/queries/auth";

export function RoleMembersList({ search }: { search: string }) {
  const { role } = Layout.useLoaderData();

  const query = useQuery({
    ...getRoleByNameQueryOptions(role.name, ["members"]),
    initialData: { success: true, role },
  });

  const filteredMembers = query.data?.role.members?.filter(member =>
    member.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      {filteredMembers?.map(user => (
        <RoleMemberItem key={user.id} user={user} role={query.data.role} />
      ))}
    </>
  );
}

function RoleMemberItem({ user, role }: { user: User; role: Role }) {
  const queryClient = useQueryClient();

  const { data: canDelete } = useQuery(authorizeQueryOptions("role:delete", role));

  const mutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.roles.remove.$post({ json: { userId, roleId: role.id } });
      console.log(res);

      if (!res.ok) {
        throw new Error("Failed to remove user role");
      }

      
      const data = await res.json();
      return data.userRole;
    },
    onError: () => toast.error("Failed to remove user role"),
    onSuccess: () => {
      toast.success("User role removed successfully");
      queryClient.setQueryData<{ success: true; role: RoleWithRelations<["members"]> }>(getRoleByNameQueryOptions(role.name).queryKey, (old) => {
        if (!old) {
          return old;
        }

        return ({
          ...old,
          role: {
            ...old.role,
            members: old.role.members?.filter((member: User) => member.id !== user.id),
          },
        });
      });
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

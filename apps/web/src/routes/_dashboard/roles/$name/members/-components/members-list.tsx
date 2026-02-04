import type { Role } from "~shared/types/db/roles.types";
import type { User } from "~shared/types/db/users.types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MailIcon, ShieldIcon, UsersIcon, UserXIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { usersKeys } from "@/api/users/users.keys";
import { AvatarUser } from "@/components/avatar-user";
import { rolesKeys } from "@/api/roles/roles.keys";
import { roleQueryOptions } from "@/api/roles/roles.queries";
import { Button } from "~react/components/button";
import { Spinner } from "~react/components/spinner";
import { api } from "~react/lib/http";
import sayno from "~react/lib/sayno";
import { cn } from "~react/lib/utils";
import { authorizeQueryOptions } from "~react/queries/auth";

import { Route as Layout } from "../../route";

export function RoleMembersList({ search }: { search: string }) {
  const { role: initialRole } = Layout.useLoaderData();
  const { data, isPending } = useQuery({
    ...roleQueryOptions(initialRole.name),
    initialData: {
      success: true,
      role: initialRole,
    },
  });

  const role = data?.role;
  const filteredMembers = role?.members?.filter(member =>
    member.name.toLowerCase().includes(search.toLowerCase())
    || member.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (!role) {
    return null;
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!filteredMembers || !filteredMembers.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          {search
            ? (
                <UserXIcon className="size-6 text-muted-foreground" />
              )
            : role.isDefault
              ? (
                  <ShieldIcon className="size-6 text-muted-foreground" />
                )
              : (
                  <UsersIcon className="size-6 text-muted-foreground" />
                )}
        </div>
        <p className="text-sm font-medium">
          {search ? "No members found" : "No members yet"}
        </p>
        <p className="mt-1 max-w-65 text-sm text-muted-foreground">
          {search
            ? `No members match "${search}"`
            : role.isDefault
              ? "All users automatically have this role"
              : "Add members to this role using the button above"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filteredMembers.map((user, index) => (
        <RoleMemberItem
          key={user.id}
          user={user}
          role={role}
          style={{ animationDelay: `${index * 30}ms` }}
        />
      ))}
    </div>
  );
}

function RoleMemberItem({
  user,
  role,
  style,
}: {
  user: User;
  role: Role;
  style?: React.CSSProperties;
}) {
  const queryClient = useQueryClient();

  const { data: canDelete } = useQuery(authorizeQueryOptions("role:delete", role));

  const isDefaultRole = role.isDefault;

  const mutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.roles[":id{[0-9]+}"].members.$delete({ param: { id: role.id.toString() }, json: { userIds: [userId] } });

      if (!res.ok) {
        throw new Error("Failed to remove user role");
      }

      return userId;
    },
    onError: () => toast.error("Failed to remove user role"),
    onSuccess: (userId: string) => {
      toast.success("User role removed successfully");
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      queryClient.invalidateQueries({ queryKey: rolesKeys.byName(role.name) });
      queryClient.invalidateQueries({ queryKey: usersKeys.relations([userId], ["roles"]) });
    },
  });

  async function handleRemove(user: User, event: React.MouseEvent) {
    if (!event.shiftKey) {
      const confirmation = await sayno.confirm({
        title: "Remove Member",
        description: `Remove ${user.name} from the ${role.label} role?`,
      });

      if (!confirmation) {
        return;
      }
    }

    mutation.mutate(user.id);
  }

  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors",
        "hover:bg-accent/50",
      )}
      style={style}
    >
      <Link
        to="/users/$userId"
        params={{ userId: encodeURIComponent(user.id) }}
        className="flex flex-1 items-center gap-3"
      >
        <AvatarUser {...user} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground group-hover:underline">
            {user.name}
          </p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MailIcon className="size-3" />
            {user.email}
          </p>
        </div>
      </Link>
      {canDelete && !isDefaultRole && (
        <Button
          variant="ghost"
          size="icon"
          onClick={event => handleRemove(user, event)}
          className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        >
          {mutation.isPending ? <Spinner className="size-4" /> : <XIcon className="size-4" />}
        </Button>
      )}
    </div>
  );
}

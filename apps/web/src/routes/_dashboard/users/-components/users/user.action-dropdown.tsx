import type { Row } from "@tanstack/react-table";
import type { User } from "~shared/types/db/users.types";

import { useQuery } from "@tanstack/react-query";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useDeleteUser } from "@/hooks/users/use-delete-user";
import { Button } from "~react/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "~react/components/dropdown-menu";
import { Spinner } from "~react/components/spinner";
import { useAuth } from "~react/hooks/use-auth";
import sayno from "~react/lib/sayno";
import { authorizeQueryOptions } from "~react/queries/auth";

export function ActionDropdown({ row: { original: user } }: { row: Row<User> }) {
  const { t } = useTranslation("web");

  const { user: loggedUser } = useAuth();
  const { data: canDelete } = useQuery(authorizeQueryOptions("user:delete", user));

  const isSelf = useMemo(() => {
    return user.id === loggedUser.id;
  }, [user, loggedUser]);

  const mutation = useDeleteUser();

  const handleDeleteClick = async () => {
    const confirmation = await sayno.confirm({
      title: t("pages.users.actions.deleteUser"),
      description: t("pages.users.actions.deleteUserConfirm"),
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
          <span className="sr-only">{t("pages.users.actions.openMenu")}</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("pages.users.actions.actionsLabel")}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
          <Copy className="size-4" />
          {t("pages.users.actions.copyUserId")}
        </DropdownMenuItem>
        {canDelete && (
          <DropdownMenuItem
            disabled={mutation.isPending || isSelf}
            onClick={handleDeleteClick}
            variant="destructive"
          >
            {mutation.isPending ? <Spinner /> : <Trash2 className="size-4" />}
            {t("pages.users.actions.deleteUser")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

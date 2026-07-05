import type { Row } from "@tanstack/react-table";
import type { User } from "~shared/types/db/users.types";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/hooks/use-auth";
import { useDeleteUser } from "@/hooks/users/use-delete-user";
import sayno from "@/lib/sayno";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "~orbit/components/ui/DropdownMenu";
import { Copy, Loader2, MoreHorizontal, Trash2 } from "~orbit/components/ui/icons";

export function ActionDropdown({ row: { original: user }, canDelete }: { row: Row<User>; canDelete: boolean }) {
  const { t } = useTranslation("web");

  const { user: loggedUser } = useAuth();

  const isSelf = useMemo(() => user.id === loggedUser.id, [user, loggedUser]);

  const mutation = useDeleteUser();

  const handleDeleteClick = async () => {
    const confirmation = await sayno.confirm({
      title: t("users.actions.deleteUser"),
      description: t("users.actions.deleteUserConfirm"),
      variant: "destructive",
    });

    if (confirmation) {
      mutation.mutate(user.id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink">
          <span className="sr-only">{t("users.actions.openMenu")}</span>
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("users.actions.actionsLabel")}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
          <Copy className="size-4" />
          {t("users.actions.copyUserId")}
        </DropdownMenuItem>
        {canDelete && (
          <DropdownMenuItem
            disabled={mutation.isPending || isSelf}
            onClick={handleDeleteClick}
            variant="danger"
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {t("users.actions.deleteUser")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

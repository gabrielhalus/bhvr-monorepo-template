import type { Row } from "@tanstack/react-table";
import type { Role } from "~shared/types/db/roles.types";

import { Copy, MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "~react/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "~react/components/dropdown-menu";

export function ActionDropdown({ row: { original: role } }: { row: Row<Role> }) {
  const { t } = useTranslation("web");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">{t("pages.roles.actions.openMenu")}</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("pages.roles.actions.actionsLabel")}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(String(role.id))}>
          <Copy className="size-4" />
          {t("pages.roles.actions.copyRoleId")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

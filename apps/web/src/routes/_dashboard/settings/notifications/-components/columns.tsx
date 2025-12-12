import type { NotificationProvider } from "@bunstack/shared/types/notification-providers";
import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";

import Actions from "./actions";
import { Badge } from "@bunstack/react/components/badge";
import { SortableHeader } from "@bunstack/react/components/sortable-header";
import { NotificationProviderType } from "@bunstack/shared/types/notification-providers";

export function getColumns(t: TFunction<"web">): ColumnDef<NotificationProvider>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title={t("pages.settings.notifications.columns.name")} />,
    },
    {
      accessorKey: "type",
      header: ({ column }) => <SortableHeader column={column} title={t("pages.settings.notifications.columns.type")} />,
      cell: ({ row }) => {
        const typeLabel = row.original.type === NotificationProviderType.DISCORD
          ? t("pages.settings.notifications.providers.discord")
          : t("pages.settings.notifications.providers.telegram");
        return <Badge variant="outline">{typeLabel}</Badge>;
      },
    },
    {
      id: "actions",
      cell: Actions,
    },
  ];
}

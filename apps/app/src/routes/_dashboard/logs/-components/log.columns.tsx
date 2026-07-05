import type { ColumnDef } from "@tanstack/react-table";
import type { BadgeProps } from "~orbit/components/ui/Badge";
import type { Log } from "~shared/types/db/logs.types";
import type { TFunction } from "i18next";

import { SortableHeader } from "@/components/data-table";
import i18n from "@/i18n";
import { Badge } from "~orbit/components/ui/Badge";
import { Calendar, Globe, User } from "~orbit/components/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "~orbit/components/ui/Tooltip";
import { formatValue } from "~shared/i18n";

type Tone = NonNullable<BadgeProps["tone"]>;

function getActionTone(action: string): Tone {
  if (action.includes("delete") || action.includes("failed")) return "coral";
  if (action.includes("create") || action.includes("register") || action.includes("login")) return "sage";
  if (action.includes("update") || action.includes("start") || action.includes("stop")) return "accent";
  return "neutral";
}

export function getLogColumns(t: TFunction<"web">): ColumnDef<Log>[] {
  return [
    {
      accessorKey: "action",
      header: ({ column }) => <SortableHeader column={column} title={t("logs.columns.action")} />,
      cell: ({ row }) => {
        const action = row.getValue("action") as string;
        const isImpersonated = !!row.original.impersonatorId;
        return (
          <div className="flex items-center gap-2">
            <Badge tone={getActionTone(action)} className="font-mono">{action}</Badge>
            {isImpersonated && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge tone="outline">{t("logs.impersonated")}</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {t("logs.impersonatedBy", { id: row.original.impersonatorId })}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
      size: 250,
    },
    {
      accessorKey: "actorId",
      header: ({ column }) => <SortableHeader column={column} title={t("logs.columns.actor")} />,
      cell: ({ row }) => {
        const actorId = row.getValue("actorId") as string;
        return (
          <div className="flex items-center gap-1.5 text-muted">
            <User className="size-3.5" />
            <span className="max-w-32 truncate font-mono text-xs">{actorId}</span>
          </div>
        );
      },
      size: 180,
    },
    {
      accessorKey: "targetType",
      header: t("logs.columns.target"),
      cell: ({ row }) => {
        const targetType = row.original.targetType;
        const targetId = row.original.targetId;
        if (!targetType) return <span className="text-muted">—</span>;
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-ink">{targetType}</span>
            {targetId && (
              <span className="max-w-24 truncate font-mono text-xs text-muted">{targetId}</span>
            )}
          </div>
        );
      },
      size: 150,
    },
    {
      accessorKey: "ip",
      header: t("logs.columns.ip"),
      cell: ({ row }) => {
        const ip = row.original.ip;
        if (!ip) return <span className="text-muted">—</span>;
        return (
          <div className="flex items-center gap-1.5 text-muted">
            <Globe className="size-3.5" />
            <span className="font-mono text-xs">{ip}</span>
          </div>
        );
      },
      size: 130,
    },
    {
      id: "spacer",
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} title={t("logs.columns.timestamp")} />,
      cell: ({ row }) => {
        const dateString = formatValue(new Date(row.original.createdAt), { locale: i18n.language, format: "datetime" });
        return (
          <div className="flex items-center gap-1.5 text-muted">
            <Calendar className="size-3.5" />
            <span className="text-xs">{dateString}</span>
          </div>
        );
      },
      size: 180,
    },
  ];
}

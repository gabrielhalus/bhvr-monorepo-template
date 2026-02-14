import type { ColumnDef } from "@tanstack/react-table";
import type { AuditLog } from "~shared/types/db/audit-logs.types";
import type { TFunction } from "i18next";

import { CalendarIcon, GlobeIcon, UserIcon } from "lucide-react";

import i18n from "@/i18n";
import { Badge } from "~react/components/badge";
import { SortableHeader } from "~react/components/sortable-header";
import { Tooltip, TooltipContent, TooltipTrigger } from "~react/components/tooltip";
import { formatValue } from "~shared/i18n";

function getActionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action.includes("delete") || action.includes("failed")) {
    return "destructive";
  }
  if (action.includes("create") || action.includes("register") || action.includes("login")) {
    return "default";
  }
  if (action.includes("update") || action.includes("start") || action.includes("stop")) {
    return "secondary";
  }
  return "outline";
}

export function getAuditLogColumns(t: TFunction): ColumnDef<AuditLog>[] {
  return [
    {
      accessorKey: "action",
      header: ({ column }) => <SortableHeader column={column} title={t("pages.logs.columns.action")} />,
      cell: ({ row }) => {
        const action = row.getValue("action") as string;
        const isImpersonated = !!row.original.impersonatorId;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={getActionBadgeVariant(action)} className="font-mono text-xs">
              {action}
            </Badge>
            {isImpersonated && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs">
                    {t("pages.logs.impersonated")}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {t("pages.logs.impersonatedBy", { id: row.original.impersonatorId })}
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
      header: ({ column }) => <SortableHeader column={column} title={t("pages.logs.columns.actor")} />,
      cell: ({ row }) => {
        const actorId = row.getValue("actorId") as string;
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <UserIcon className="size-3.5" />
            <span className="font-mono text-xs truncate max-w-32">{actorId}</span>
          </div>
        );
      },
      size: 180,
    },
    {
      accessorKey: "targetType",
      header: t("pages.logs.columns.target"),
      cell: ({ row }) => {
        const targetType = row.original.targetType;
        const targetId = row.original.targetId;
        if (!targetType) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium">{targetType}</span>
            {targetId && (
              <span className="font-mono text-xs text-muted-foreground truncate max-w-24">{targetId}</span>
            )}
          </div>
        );
      },
      size: 150,
    },
    {
      accessorKey: "ip",
      header: t("pages.logs.columns.ip"),
      cell: ({ row }) => {
        const ip = row.original.ip;
        if (!ip) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <GlobeIcon className="size-3.5" />
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
      header: ({ column }) => <SortableHeader column={column} title={t("pages.logs.columns.timestamp")} />,
      cell: ({ row }) => {
        const timestamp = row.original.createdAt;
        const dateString = formatValue(new Date(timestamp), { locale: i18n.language, format: "datetime" });
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarIcon className="size-3.5" />
            <span className="text-xs">{dateString}</span>
          </div>
        );
      },
      size: 180,
    },
  ];
}

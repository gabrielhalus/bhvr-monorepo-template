import type { ColumnDef } from "@tanstack/react-table";
import type { CronTaskRun } from "~shared/queries/cron-task-runs.queries";
import type { TFunction } from "i18next";

import { ClockIcon } from "lucide-react";

import i18n from "@/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "~react/components/tooltip";
import { formatValue } from "~shared/i18n";

import { StatusBadge } from "./cron-runs.status-badge";

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function getCronRunColumns(t: TFunction): ColumnDef<CronTaskRun>[] {
  return [
    {
      accessorKey: "status",
      header: t("pages.cron.runs.columns.status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 100,
    },
    {
      accessorKey: "startedAt",
      header: t("pages.cron.runs.columns.startedAt"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ClockIcon className="size-3.5 shrink-0" />
          <span>{formatValue(new Date(row.original.startedAt), { locale: i18n.language, format: "datetime" })}</span>
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: "durationMs",
      header: t("pages.cron.runs.columns.duration"),
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {formatDuration(row.original.durationMs)}
        </span>
      ),
      size: 100,
    },
    {
      id: "spacer",
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "output",
      header: t("pages.cron.runs.columns.output"),
      cell: ({ row }) => {
        const text = row.original.error ?? row.original.output;
        if (!text) return <span className="text-muted-foreground">—</span>;
        const truncated = text.length > 60 ? `${text.slice(0, 60)}…` : text;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm text-muted-foreground font-mono cursor-help truncate max-w-50 block">
                {truncated}
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs wrap-break-word">
              {text}
            </TooltipContent>
          </Tooltip>
        );
      },
      enableSorting: false,
      size: 250,
    },
  ];
}

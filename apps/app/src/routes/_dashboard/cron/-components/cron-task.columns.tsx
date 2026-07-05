import type { ColumnDef } from "@tanstack/react-table";
import type { CronTask } from "~shared/queries/cron-tasks.queries";
import type { TFunction } from "i18next";

import { Link } from "@tanstack/react-router";

import { SortableHeader } from "@/components/data-table";
import i18n from "@/i18n";
import { Calendar, Clock } from "~orbit/components/ui/icons";
import { formatValue } from "~shared/i18n";

import { CronTaskActionDropdown } from "./cron-task.action-dropdown";
import { EnabledCell } from "./cron-task.enabled-cell";

export function getCronTaskColumns(t: TFunction<"web">): ColumnDef<CronTask>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title={t("cron.columns.name")} />,
      cell: ({ row }) => (
        <Link
          to="/cron/$taskId"
          params={{ taskId: row.original.id }}
          className="group flex flex-col min-w-0"
        >
          <span className="font-medium text-ink group-hover:underline truncate">
            {row.original.name}
          </span>
          {row.original.description && (
            <span className="text-xs text-muted truncate">{row.original.description}</span>
          )}
        </Link>
      ),
      size: 250,
    },
    {
      accessorKey: "cronExpression",
      header: t("cron.columns.expression"),
      cell: ({ row }) => (
        <code className="font-mono text-xs bg-surface-2 px-2 py-0.5 rounded-md border border-line/60">
          {row.original.cronExpression}
        </code>
      ),
      size: 160,
    },
    {
      accessorKey: "handler",
      header: t("cron.columns.handler"),
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-[5px] border border-line bg-surface-2 px-1.75 py-0.5 font-mono text-[11px] font-medium text-muted">
          {row.original.handler}
        </span>
      ),
      size: 200,
    },
    {
      accessorKey: "isEnabled",
      header: t("cron.columns.status"),
      cell: ({ row }) => <EnabledCell task={row.original} />,
      enableSorting: false,
      size: 80,
    },
    {
      accessorKey: "lastRunAt",
      header: ({ column }) => <SortableHeader column={column} title={t("cron.columns.lastRun")} />,
      cell: ({ row }) => {
        const ts = row.original.lastRunAt;
        if (!ts) return <span className="text-muted text-sm">—</span>;
        return (
          <div className="flex items-center gap-1.5 text-sm text-muted">
            <Clock className="size-3.5 shrink-0" />
            <span>{formatValue(new Date(ts), { locale: i18n.language, format: "relative" })}</span>
          </div>
        );
      },
      size: 150,
    },
    {
      accessorKey: "nextRunAt",
      header: ({ column }) => <SortableHeader column={column} title={t("cron.columns.nextRun")} />,
      cell: ({ row }) => {
        const ts = row.original.nextRunAt;
        if (!ts) return <span className="text-muted text-sm">—</span>;
        return (
          <div className="flex items-center gap-1.5 text-sm text-muted">
            <Calendar className="size-3.5 shrink-0" />
            <span>{formatValue(new Date(ts), { locale: i18n.language, format: "relative" })}</span>
          </div>
        );
      },
      size: 150,
    },
    {
      id: "spacer",
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "actions",
      cell: ({ row }) => <CronTaskActionDropdown row={row} />,
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
  ];
}

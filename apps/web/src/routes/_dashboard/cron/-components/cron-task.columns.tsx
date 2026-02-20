import type { ColumnDef } from "@tanstack/react-table";
import type { CronTask } from "~shared/queries/cron-tasks.queries";
import type { TFunction } from "i18next";

import { Link } from "@tanstack/react-router";
import { CalendarIcon, ClockIcon } from "lucide-react";

import { useToggleCronTask } from "@/hooks/cron-tasks/use-toggle-cron-task";
import i18n from "@/i18n";
import { Badge } from "~react/components/badge";
import { SortableHeader } from "~react/components/sortable-header";
import { Switch } from "~react/components/switch";
import { formatValue } from "~shared/i18n";

import { CronTaskActionDropdown } from "./cron-task.action-dropdown";

function EnabledCell({ task }: { task: CronTask }) {
  const toggle = useToggleCronTask();

  return (
    <Switch
      checked={task.isEnabled}
      onCheckedChange={() => toggle.mutate(task.id)}
      disabled={toggle.isPending}
      aria-label={task.isEnabled ? "Disable task" : "Enable task"}
    />
  );
}

export function getCronTaskColumns(t: TFunction): ColumnDef<CronTask>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title={t("pages.cron.columns.name")} />,
      cell: ({ row }) => (
        <Link
          to="/cron/$taskId"
          params={{ taskId: row.original.id }}
          className="group flex flex-col min-w-0"
        >
          <span className="font-medium text-foreground group-hover:underline truncate">
            {row.original.name}
          </span>
          {row.original.description && (
            <span className="text-xs text-muted-foreground truncate">{row.original.description}</span>
          )}
        </Link>
      ),
      size: 250,
    },
    {
      accessorKey: "cronExpression",
      header: t("pages.cron.columns.expression"),
      cell: ({ row }) => (
        <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded-md border border-border/60">
          {row.original.cronExpression}
        </code>
      ),
      size: 160,
    },
    {
      accessorKey: "handler",
      header: t("pages.cron.columns.handler"),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs font-normal">
          {row.original.handler}
        </Badge>
      ),
      size: 200,
    },
    {
      accessorKey: "isEnabled",
      header: t("pages.cron.columns.status"),
      cell: ({ row }) => <EnabledCell task={row.original} />,
      enableSorting: false,
      size: 80,
    },
    {
      accessorKey: "lastRunAt",
      header: ({ column }) => <SortableHeader column={column} title={t("pages.cron.columns.lastRun")} />,
      cell: ({ row }) => {
        const ts = row.original.lastRunAt;
        if (!ts) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ClockIcon className="size-3.5 shrink-0" />
            <span>{formatValue(new Date(ts), { locale: i18n.language, format: "relative" })}</span>
          </div>
        );
      },
      size: 150,
    },
    {
      accessorKey: "nextRunAt",
      header: ({ column }) => <SortableHeader column={column} title={t("pages.cron.columns.nextRun")} />,
      cell: ({ row }) => {
        const ts = row.original.nextRunAt;
        if (!ts) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarIcon className="size-3.5 shrink-0" />
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

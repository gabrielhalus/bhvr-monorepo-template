import { createFileRoute } from "@tanstack/react-router";
import { CalendarClockIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cronTaskStatsQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";

import { CronStatsCards } from "./-components/cron-stats-cards";
import { CronTasksDataTable } from "./-components/cron-tasks.data-table";

export const Route = createFileRoute("/_dashboard/cron/")({
  component: CronTasksPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(cronTaskStatsQueryOptions),
});

function CronTasksPage() {
  const { t } = useTranslation("web");

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      {/* Hero panel */}
      <div className="relative overflow-hidden rounded-2xl p-7 md:p-9" style={{ background: "oklch(0.115 0.008 265)" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(oklch(0.920 0.006 265 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(0.920 0.006 265 / 0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: "oklch(0.640 0.222 42)", opacity: 0.18 }}
        />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="size-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.640 0.222 42 / 0.20)" }}
            >
              <CalendarClockIcon className="size-5" style={{ color: "oklch(0.640 0.222 42)" }} />
            </div>
            <div>
              <h1
                className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight"
                style={{ color: "oklch(0.930 0.006 265)" }}
              >
                {t("pages.cron.title")}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "oklch(0.550 0.012 265)" }}>
                {t("pages.cron.list.subtitle")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <CronStatsCards />

      {/* Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t("pages.cron.title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("pages.cron.list.subtitle")}</p>
        </div>
        <CronTasksDataTable />
      </div>
    </div>
  );
}

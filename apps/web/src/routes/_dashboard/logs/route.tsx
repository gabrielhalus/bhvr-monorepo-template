import { createFileRoute, redirect } from "@tanstack/react-router";
import { ScrollTextIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { authorizeQueryOptions } from "~react/queries/auth";

import { AuditLogsDataTable } from "./-components/audit-logs.data-table";

export const Route = createFileRoute("/_dashboard/logs")({
  component: LogsPage,
  beforeLoad: async ({ context }) => {
    const canList = await context.queryClient.ensureQueryData(authorizeQueryOptions("auditLog:list"));

    if (!canList) {
      throw redirect({ to: "/" });
    }
  },
  staticData: { crumb: "pages.logs.title" },
});

function LogsPage() {
  const { t } = useTranslation("web");

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      {/* Hero panel */}
      <div className="relative overflow-hidden rounded-2xl p-7 md:p-9 bg-panel">
        <div className="absolute inset-0 pointer-events-none hero-grid" />
        <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl pointer-events-none bg-primary opacity-[0.18]" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="size-11 rounded-xl flex items-center justify-center shrink-0 bg-primary/20">
            <ScrollTextIcon className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight text-panel-heading">
              {t("pages.logs.title")}
            </h1>
            <p className="text-sm mt-0.5 text-panel-meta">
              {t("pages.logs.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <AuditLogsDataTable />
    </div>
  );
}

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ShellHeader } from "@/components/shell-header";
import { authorizeBatchQueryOptions } from "@/queries/auth";

import { LogsDataTable } from "./-components/logs.data-table";

export const Route = createFileRoute("/_dashboard/logs")({
  component: LogsPage,
  beforeLoad: async ({ context }) => {
    const results = await context.queryClient.ensureQueryData(
      authorizeBatchQueryOptions([{ permission: "log:list" }]),
    );

    if (!results[0]) {
      throw redirect({ to: "/" });
    }
  },
  staticData: { crumb: "logs.title" },
});

function LogsPage() {
  const { t } = useTranslation("web");

  return (
    <div className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-4 px-4 py-6 md:px-8">
      <ShellHeader eyebrow={t("logs.subtitle")} title={t("logs.title")} />
      <LogsDataTable />
    </div>
  );
}

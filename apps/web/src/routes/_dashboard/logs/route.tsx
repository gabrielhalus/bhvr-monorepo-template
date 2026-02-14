import { createFileRoute, redirect } from "@tanstack/react-router";

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
  return (
    <div className="w-full p-10">
      <AuditLogsDataTable />
    </div>
  );
}

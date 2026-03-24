import type { CronTaskRun } from "~shared/queries/cron-task-runs.queries";

import { Badge } from "~react/components/badge";

export function StatusBadge({ status }: { status: CronTaskRun["status"] }) {
  if (status === "success") {
    return (
      <Badge className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/20">
        Success
      </Badge>
    );
  }
  if (status === "error") {
    return <Badge variant="destructive">Error</Badge>;
  }
  return <Badge variant="outline">Running</Badge>;
}

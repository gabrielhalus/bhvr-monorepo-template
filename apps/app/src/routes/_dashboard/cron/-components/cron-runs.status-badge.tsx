import type { BadgeProps } from "~orbit/components/ui/Badge";
import type { CronTaskRun } from "~shared/queries/cron-task-runs.queries";

import { useTranslation } from "react-i18next";

import { Badge } from "~orbit/components/ui/Badge";

type Tone = NonNullable<BadgeProps["tone"]>;

const TONE: Record<CronTaskRun["status"], Tone> = {
  success: "sage",
  error: "coral",
  running: "sky",
};

export function StatusBadge({ status }: { status: CronTaskRun["status"] }) {
  const { t } = useTranslation("web");
  return (
    <Badge tone={TONE[status] ?? "sky"} dot>
      {t(`cron.runs.status.${status}` as never)}
    </Badge>
  );
}

import type { CronTask } from "~shared/queries/cron-tasks.queries";

import { useToggleCronTask } from "@/hooks/cron-tasks/use-toggle-cron-task";
import { Switch } from "~react/components/switch";

export function EnabledCell({ task }: { task: CronTask }) {
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

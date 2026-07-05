import type { CronTask } from "~shared/queries/cron-tasks.queries";

import { useToggleCronTask } from "@/hooks/cron-tasks/use-toggle-cron-task";
import { Switch } from "~orbit/components/ui/Toggle";

export function EnabledCell({ task }: { task: CronTask }) {
  const toggle = useToggleCronTask();

  return (
    <Switch
      checked={task.isEnabled}
      onChange={() => toggle.mutate(task.id)}
      disabled={toggle.isPending}
      aria-label={task.isEnabled ? "Disable task" : "Enable task"}
    />
  );
}

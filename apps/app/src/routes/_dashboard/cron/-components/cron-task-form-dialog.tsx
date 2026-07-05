import type { CronTask } from "~shared/queries/cron-tasks.queries";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Fg } from "@/components/form-kit";
import { useCreateCronTask } from "@/hooks/cron-tasks/use-create-cron-task";
import { useUpdateCronTask } from "@/hooks/cron-tasks/use-update-cron-task";
import { Button } from "~orbit/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~orbit/components/ui/Dialog";
import { Input, Textarea } from "~orbit/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~orbit/components/ui/Select";
import { Switch } from "~orbit/components/ui/Toggle";

const AVAILABLE_HANDLERS = [
  { value: "noop", label: "No-op (Test)" },
  { value: "cleanup-expired-invitations", label: "Cleanup Expired Invitations" },
  { value: "daily-db-backup", label: "Daily DB Backup (S3)" },
  { value: "local-db-backup", label: "Daily DB Backup (Local)" },
  { value: "sms-reconfirmation-7d", label: "SMS Reconfirmation (7 days)" },
  { value: "sms-reminder-24h", label: "SMS Reminder (24h)" },
] as const;

type FormState = {
  name: string;
  description: string;
  cronExpression: string;
  handler: string;
  isEnabled: boolean;
};

const defaultForm: FormState = {
  name: "",
  description: "",
  cronExpression: "0 * * * *",
  handler: "noop",
  isEnabled: true,
};

export function CronTaskFormDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: CronTask;
}) {
  const { t } = useTranslation("web");
  const isEdit = !!task;

  const [form, setForm] = useState<FormState>(() =>
    task
      ? {
          name: task.name,
          description: task.description ?? "",
          cronExpression: task.cronExpression,
          handler: task.handler,
          isEnabled: task.isEnabled,
        }
      : defaultForm,
  );

  const createMutation = useCreateCronTask();
  const updateMutation = useUpdateCronTask();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      description: form.description || undefined,
      cronExpression: form.cronExpression,
      handler: form.handler,
      isEnabled: form.isEnabled,
    };

    if (isEdit && task) {
      updateMutation.mutate({ id: task.id, data }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(
        data as Parameters<typeof createMutation.mutate>[0],
        { onSuccess: () => {
          onOpenChange(false);
          setForm(defaultForm);
        } },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("cron.actions.editTask") : t("cron.actions.createTask")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
          <Fg label={t("cron.form.name")} htmlFor="cron-name" req>
            <Input
              id="cron-name"
              placeholder={t("cron.form.namePlaceholder")}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </Fg>

          <Fg label={t("cron.form.description")} htmlFor="cron-description">
            <Textarea
              id="cron-description"
              placeholder={t("cron.form.descriptionPlaceholder")}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </Fg>

          <Fg label={t("cron.form.cronExpression")} htmlFor="cron-expression" hint={t("cron.form.cronExpressionHelp")} req>
            <Input
              id="cron-expression"
              className="font-mono"
              value={form.cronExpression}
              onChange={e => setForm(f => ({ ...f, cronExpression: e.target.value }))}
              required
            />
          </Fg>

          <Fg label={t("cron.form.handler")}>
            <Select value={form.handler} onValueChange={v => setForm(f => ({ ...f, handler: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_HANDLERS.map(h => (
                  <SelectItem key={h.value} value={h.value}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Fg>

          <div className="flex items-center justify-between py-1">
            <span className="text-[13px] font-medium text-ink">
              {t("cron.form.isEnabled")}
            </span>
            <Switch
              id="cron-enabled"
              checked={form.isEnabled}
              onChange={v => setForm(f => ({ ...f, isEnabled: v }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !form.name || !form.cronExpression}>
              {isPending ? t("form.saving") : isEdit ? t("actions.save") : t("cron.actions.createTask")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

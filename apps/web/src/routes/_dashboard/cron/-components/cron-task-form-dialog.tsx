import type { CronTask } from "~shared/queries/cron-tasks.queries";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useCreateCronTask } from "@/hooks/cron-tasks/use-create-cron-task";
import { useUpdateCronTask } from "@/hooks/cron-tasks/use-update-cron-task";
import { Button } from "~react/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~react/components/dialog";
import { Input } from "~react/components/input";
import { Label } from "~react/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~react/components/select";
import { Switch } from "~react/components/switch";
import { Textarea } from "~react/components/textarea";

const AVAILABLE_HANDLERS = [
  { value: "noop", label: "No-op (Test)" },
  { value: "cleanup-expired-invitations", label: "Cleanup Expired Invitations" },
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
      createMutation.mutate(data as Parameters<typeof createMutation.mutate>[0], { onSuccess: () => { onOpenChange(false); setForm(defaultForm); } });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("pages.cron.actions.editTask") : t("pages.cron.actions.createTask")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cron-name">{t("pages.cron.form.name")}</Label>
            <Input
              id="cron-name"
              placeholder={t("pages.cron.form.namePlaceholder")}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cron-description">{t("pages.cron.form.description")}</Label>
            <Textarea
              id="cron-description"
              placeholder={t("pages.cron.form.descriptionPlaceholder")}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="rounded-lg resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cron-expression">{t("pages.cron.form.cronExpression")}</Label>
            <Input
              id="cron-expression"
              value={form.cronExpression}
              onChange={e => setForm(f => ({ ...f, cronExpression: e.target.value }))}
              required
              className="rounded-lg font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">{t("pages.cron.form.cronExpressionHelp")}</p>
          </div>

          <div className="space-y-1.5">
            <Label>{t("pages.cron.form.handler")}</Label>
            <Select value={form.handler} onValueChange={v => setForm(f => ({ ...f, handler: v }))}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {AVAILABLE_HANDLERS.map(h => (
                  <SelectItem key={h.value} value={h.value}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between py-1">
            <Label htmlFor="cron-enabled" className="cursor-pointer">
              {t("pages.cron.form.isEnabled")}
            </Label>
            <Switch
              id="cron-enabled"
              checked={form.isEnabled}
              onCheckedChange={v => setForm(f => ({ ...f, isEnabled: v }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !form.name || !form.cronExpression}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

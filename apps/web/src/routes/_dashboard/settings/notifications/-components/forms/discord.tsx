import type { updateDiscordProviderSchema } from "@bunstack/shared/types/notification-providers";
import type { z } from "zod";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { translateErrors } from "@bunstack/i18n";
import { Button } from "@bunstack/react/components/button";
import { Card } from "@bunstack/react/components/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@bunstack/react/components/field";
import { Input } from "@bunstack/react/components/input";
import { Spinner } from "@bunstack/react/components/spinner";
import { Switch } from "@bunstack/react/components/switch";
import { api } from "@bunstack/react/lib/http";
import { queryClient } from "@bunstack/react/lib/query-client";
import sayno from "@bunstack/react/lib/sayno";
import { insertDiscordProviderSchema, NotificationProviderType } from "@bunstack/shared/types/notification-providers";

type DiscordFormProps = {
  setOpen: (open: boolean) => void;
  initialValues?: z.infer<typeof updateDiscordProviderSchema> & { id: string };
};

export default function DiscordForm({ setOpen, initialValues }: DiscordFormProps) {
  const { t } = useTranslation("web");
  const mode = initialValues ? "update" : "create";
  const providerId = initialValues?.id;

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof insertDiscordProviderSchema>) => {
      const res = await api.notifications.discord.$post({
        json: values,
      });

      if (!res.ok) {
        throw new Error(t("pages.settings.notifications.forms.discord.error.create"));
      }

      queryClient.invalidateQueries({ queryKey: ["get-notification-providers-paginated"] });
      return true;
    },
    onSuccess: () => {
      setOpen(false);
      toast.success(t("pages.settings.notifications.forms.discord.success.created"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("pages.settings.notifications.forms.discord.error.create"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof updateDiscordProviderSchema>) => {
      const res = await api.notifications.discord[":id"].$put({
        json: values,
        param: { id: providerId as string },
      });

      if (!res.ok) {
        throw new Error(t("pages.settings.notifications.forms.discord.error.update"));
      }

      queryClient.invalidateQueries({ queryKey: ["get-notification-providers-paginated"] });
      return true;
    },
    onSuccess: () => {
      setOpen(false);
      toast.success(t("pages.settings.notifications.forms.discord.success.updated"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("pages.settings.notifications.forms.discord.error.update"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.notifications.discord[":id"].$delete({
        param: { id: providerId as string },
      });

      if (!res.ok) {
        throw new Error(t("pages.settings.notifications.forms.discord.error.delete"));
      }

      return true;
    },
    onSuccess: (deleted) => {
      if (deleted) {
        setOpen(false);
        toast.success(t("pages.settings.notifications.forms.discord.success.deleted"));
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("pages.settings.notifications.forms.discord.error.delete"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["get-notification-providers-paginated"] });
    },
  });

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!event.shiftKey) {
      const confirmation = await sayno({
        title: t("pages.settings.notifications.forms.discord.deleteConfirm.title"),
        description: t("pages.settings.notifications.forms.discord.deleteConfirm.description"),
        variant: "destructive",
        confirmText: t("pages.settings.notifications.forms.discord.deleteConfirm.confirmText"),
        cancelText: t("pages.settings.notifications.forms.discord.deleteConfirm.cancelText"),
      });

      if (!confirmation) {
        return;
      }
    }

    deleteMutation.mutate();
  };

  const form = useForm({
    defaultValues: {
      // Common fields
      name: initialValues?.name ?? "",
      type: NotificationProviderType.DISCORD,
      // Discord fields
      webhookUrl: initialValues?.webhookUrl ?? "",
      decorations: initialValues?.decorations ?? true,
    } as z.infer<typeof insertDiscordProviderSchema>,
    validators: {
      onChange: insertDiscordProviderSchema,
    },
    onSubmit: ({ value }) => {
      const mutate = mode === "create"
        ? createMutation.mutate
        : updateMutation.mutate;

      mutate(value);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit();
  };

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await api.notifications.discord.test.$post({
        json: {
          webhookUrl: form.state.values.webhookUrl,
          decorations: form.state.values.decorations,
        },
      });

      if (!res.ok) {
        throw new Error(t("pages.settings.notifications.forms.discord.error.test"));
      }

      return true;
    },
    onSuccess: () => {
      toast.success(t("pages.settings.notifications.forms.discord.success.testSent"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("pages.settings.notifications.forms.discord.error.test"));
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>{t("pages.settings.notifications.forms.discord.name.label")}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder={t("pages.settings.notifications.forms.discord.name.placeholder")}
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={translateErrors(field.state.meta.errors, t)} />}
              </Field>
            );
          }}
        />
        <form.Field
          name="webhookUrl"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>{t("pages.settings.notifications.forms.discord.webhookUrl.label")}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder={t("pages.settings.notifications.forms.discord.webhookUrl.placeholder")}
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={translateErrors(field.state.meta.errors, t)} />}
              </Field>
            );
          }}
        />
        <form.Field
          name="decorations"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <Card className="flex-row justify-between items-center p-4">
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor={field.name}>{t("pages.settings.notifications.forms.discord.decorations.label")}</FieldLabel>
                    <FieldDescription>
                      {t("pages.settings.notifications.forms.discord.decorations.description")}
                    </FieldDescription>
                  </div>
                  <Switch
                    id={field.name}
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={checked => field.handleChange(checked)}
                    aria-invalid={isInvalid}
                  />
                </Card>
                {isInvalid && <FieldError errors={translateErrors(field.state.meta.errors, t)} />}
              </Field>
            );
          }}
        />
        <form.Subscribe
          selector={state => [state.isValid, state.isSubmitting]}
          children={([isValid, isSubmitting]) => {
            return (
              <div className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
                  {testMutation.isPending
                    ? (
                        <span className="flex items-center gap-2">
                          <Spinner />
                          {t("pages.settings.notifications.forms.discord.testing")}
                        </span>
                      )
                    : t("pages.settings.notifications.forms.discord.testNotification")}
                </Button>
                <div className="flex items-center gap-2">
                  {mode === "update" && (
                    <Button variant="ghost" className="hover:bg-destructive/10 hover:text-destructive transition-colors" type="button" onClick={handleDelete}>
                      {deleteMutation.isPending
                        ? (
                            <span className="flex items-center gap-2">
                              <Spinner />
                              {t("pages.settings.notifications.forms.discord.deleting")}
                            </span>
                          )
                        : t("pages.settings.notifications.forms.discord.delete")}
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting || !isValid}>
                    {isSubmitting
                      ? (
                          <span className="flex items-center gap-2">
                            <Spinner />
                            {t("pages.settings.notifications.forms.discord.submitting")}
                          </span>
                        )
                      : t("pages.settings.notifications.forms.discord.submit")}
                  </Button>
                </div>
              </div>
            );
          }}
        />
      </FieldGroup>
    </form>
  );
}

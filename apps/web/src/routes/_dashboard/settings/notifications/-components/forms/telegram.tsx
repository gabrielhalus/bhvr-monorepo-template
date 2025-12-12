import type { updateTelegramProviderSchema } from "@bunstack/shared/types/notification-providers";
import type { z } from "zod";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { translateErrors } from "@bunstack/i18n";
import { Button } from "@bunstack/react/components/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@bunstack/react/components/field";
import { Input } from "@bunstack/react/components/input";
import { Spinner } from "@bunstack/react/components/spinner";
import { api } from "@bunstack/react/lib/http";
import { queryClient } from "@bunstack/react/lib/query-client";
import sayno from "@bunstack/react/lib/sayno";
import { insertTelegramProviderSchema, NotificationProviderType } from "@bunstack/shared/types/notification-providers";

type TelegramFormProps = {
  setOpen: (open: boolean) => void;
  initialValues?: z.infer<typeof updateTelegramProviderSchema> & { id: string };
};

export default function TelegramForm({ setOpen, initialValues }: TelegramFormProps) {
  const { t } = useTranslation("web");
  const mode = initialValues ? "update" : "create";
  const providerId = initialValues?.id;

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof insertTelegramProviderSchema>) => {
      const res = await api.notifications.telegram.$post({
        json: values,
      });

      if (!res.ok) {
        throw new Error(t("pages.settings.notifications.forms.telegram.error.create"));
      }

      queryClient.invalidateQueries({ queryKey: ["get-notification-providers-paginated"] });

      return true;
    },
    onSuccess: () => {
      setOpen(false);
      toast.success(t("pages.settings.notifications.forms.telegram.success.created"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("pages.settings.notifications.forms.telegram.error.create"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof updateTelegramProviderSchema>) => {
      const res = await api.notifications.telegram[":id"].$put({
        json: values,
        param: { id: providerId as string },
      });

      if (!res.ok) {
        throw new Error(t("pages.settings.notifications.forms.telegram.error.update"));
      }

      queryClient.invalidateQueries({ queryKey: ["get-notification-providers-paginated"] });
      return true;
    },
    onSuccess: () => {
      setOpen(false);
      toast.success(t("pages.settings.notifications.forms.telegram.success.updated"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("pages.settings.notifications.forms.telegram.error.update"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.notifications.telegram[":id"].$delete({
        param: { id: providerId as string },
      });

      if (!res.ok) {
        throw new Error(t("pages.settings.notifications.forms.telegram.error.delete"));
      }

      return true;
    },
    onSuccess: (deleted) => {
      if (deleted) {
        setOpen(false);
        toast.success(t("pages.settings.notifications.forms.telegram.success.deleted"));
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("pages.settings.notifications.forms.telegram.error.delete"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["get-notification-providers-paginated"] });
    },
  });

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!event.shiftKey) {
      const confirmation = await sayno({
        title: t("pages.settings.notifications.forms.telegram.deleteConfirm.title"),
        description: t("pages.settings.notifications.forms.telegram.deleteConfirm.description"),
        variant: "destructive",
        confirmText: t("pages.settings.notifications.forms.telegram.deleteConfirm.confirmText"),
        cancelText: t("pages.settings.notifications.forms.telegram.deleteConfirm.cancelText"),
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
      type: NotificationProviderType.TELEGRAM,
      // Telegram fields
      botToken: initialValues?.botToken ?? "",
      chatId: initialValues?.chatId ?? "",
      threadId: initialValues?.threadId ?? null,
    } as z.infer<typeof insertTelegramProviderSchema>,
    validators: {
      onChange: insertTelegramProviderSchema,
    },
    onSubmit: ({ value }) => {
      const mutate = mode === "create"
        ? createMutation.mutate
        : updateMutation.mutate;

      mutate(value);
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await api.notifications.telegram.test.$post({
        json: {
          botToken: form.state.values.botToken,
          chatId: form.state.values.chatId,
          threadId: form.state.values.threadId,
        },
      });

      if (!res.ok) {
        throw new Error(t("pages.settings.notifications.forms.telegram.error.test"));
      }

      return true;
    },
    onSuccess: () => {
      toast.success(t("pages.settings.notifications.forms.telegram.success.testSent"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("pages.settings.notifications.forms.telegram.error.test"));
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>{t("pages.settings.notifications.forms.telegram.name.label")}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder={t("pages.settings.notifications.forms.telegram.name.placeholder")}
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={translateErrors(field.state.meta.errors, t)} />}
              </Field>
            );
          }}
        />
        <form.Field
          name="botToken"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>{t("pages.settings.notifications.forms.telegram.botToken.label")}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder={t("pages.settings.notifications.forms.telegram.botToken.placeholder")}
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={translateErrors(field.state.meta.errors, t)} />}
              </Field>
            );
          }}
        />
        <form.Field
          name="chatId"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>{t("pages.settings.notifications.forms.telegram.chatId.label")}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder={t("pages.settings.notifications.forms.telegram.chatId.placeholder")}
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={translateErrors(field.state.meta.errors, t)} />}
              </Field>
            );
          }}
        />
        <form.Field
          name="threadId"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>{t("pages.settings.notifications.forms.telegram.threadId.label")}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder={t("pages.settings.notifications.forms.telegram.threadId.placeholder")}
                  autoComplete="off"
                />
                <FieldDescription>{t("pages.settings.notifications.forms.telegram.threadId.description")}</FieldDescription>
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
                <Button variant="outline" type="button" onClick={() => testMutation.mutate()}>
                  {testMutation.isPending
                    ? (
                        <span className="flex items-center gap-2">
                          <Spinner />
                          {t("pages.settings.notifications.forms.telegram.testing")}
                        </span>
                      )
                    : t("pages.settings.notifications.forms.telegram.testNotification")}
                </Button>
                <div className="flex items-center gap-2">
                  {mode === "update" && (
                    <Button variant="ghost" className="hover:bg-destructive/10 hover:text-destructive transition-colors" type="button" onClick={handleDelete}>
                      {deleteMutation.isPending
                        ? (
                            <span className="flex items-center gap-2">
                              <Spinner />
                              {t("pages.settings.notifications.forms.telegram.deleting")}
                            </span>
                          )
                        : t("pages.settings.notifications.forms.telegram.delete")}
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting || !isValid}>
                    {isSubmitting
                      ? (
                          <span className="flex items-center gap-2">
                            <Spinner />
                            {t("pages.settings.notifications.forms.telegram.submitting")}
                          </span>
                        )
                      : t("pages.settings.notifications.forms.telegram.submit")}
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

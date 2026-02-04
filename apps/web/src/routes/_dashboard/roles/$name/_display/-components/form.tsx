import type { z } from "zod";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "~react/components/button";
import { Field, FieldContent, FieldError, FieldLabel } from "~react/components/field";
import { Input } from "~react/components/input";
import { Spinner } from "~react/components/spinner";
import { api } from "~react/lib/http";
import { UpdateRoleSchema } from "~shared/schemas/api/roles.schemas";

import { Route as Layout } from "../../route";

type UpdateRoleData = z.infer<typeof UpdateRoleSchema>;

export function Form() {
  const { t } = useTranslation(["common", "web"]);
  const queryClient = useQueryClient();

  const { role } = Layout.useLoaderData();

  const formRef = useRef<{ reset: (values: UpdateRoleData) => void } | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRoleData }) => {
      const res = await api.roles[":id{[0-9]+}"].$put({
        param: { id: String(id) },
        json: data,
      });

      if (!res.ok) {
        throw new Error("Failed to update role");
      }

      return res.json();
    },
    onSuccess: (response) => {
      toast.success(`Role successfully updated`);
      queryClient.refetchQueries({ queryKey: ["roles"] });
      formRef.current?.reset(response.role);
    },
    onError: () => {
      toast.error("Failed to update role");
    },
  });

  const form = useForm({
    validators: { onChange: UpdateRoleSchema },
    defaultValues: {
      label: role.label || "",
      description: role.description ?? null,
    },
    onSubmit: async ({ value }) => {
      if (role) {
        mutation.mutate({ id: role.id, data: value });
      }
    },
  });

  formRef.current = form;

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit(e);
    }}
    >
      <div className="grid gap-4">
        <div className="grid gap-4">
          <form.Field
            name="label"
            children={field => (
              <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                <FieldLabel htmlFor={field.name}>
                  {t("web:pages.roles.detail.pages.display.fields.label")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    type="text"
                    placeholder="Role"
                    required
                  />
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          />
          <form.Field
            name="description"
            children={field => (
              <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                <FieldLabel htmlFor={field.name}>
                  {t("web:pages.roles.detail.pages.display.fields.description")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    type="text"
                    placeholder="Description"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          />
        </div>
        <form.Subscribe
          selector={state => [state.canSubmit, state.isSubmitting, state.isDefaultValue]}
          children={([canSubmit, isSubmitting, isDefaultValue]) => (
            <Button type="submit" disabled={!canSubmit || isDefaultValue}>
              {isSubmitting
                ? (
                    <span className="flex items-center space-x-2">
                      <Spinner />
                      {t("form.saving")}
                    </span>
                  )
                : isDefaultValue
                  ? (
                      t("form.noChanges")
                    )
                  : (
                      t("form.save")
                    )}
            </Button>
          )}
        />
      </div>
    </form>
  );
}

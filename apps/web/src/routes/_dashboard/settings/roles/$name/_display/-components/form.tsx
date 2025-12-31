import type { z } from "zod";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Route as Layout } from "../../route";
import { getAllRolesQueryOptions } from "@/queries/roles";
import { Button } from "@bunstack/react/components/button";
import { Field, FieldContent, FieldError, FieldLabel } from "@bunstack/react/components/field";
import { Input } from "@bunstack/react/components/input";
import { Spinner } from "@bunstack/react/components/spinner";
import { api } from "@bunstack/react/lib/http";
import { UpdateRoleSchema } from "@bunstack/shared/schemas/api/roles.schemas";

type UpdateRoleData = z.infer<typeof UpdateRoleSchema>;

export function Form() {
  const { t } = useTranslation(["common", "web"]);
  const queryClient = useQueryClient();
  const params = Layout.useParams();

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
      queryClient.refetchQueries(getAllRolesQueryOptions);
      queryClient.invalidateQueries({ queryKey: ["get-role-by-name", params.name] });
      queryClient.invalidateQueries({ queryKey: ["get-roles-paginated"] });
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
                  {t("web:pages.settings.roles.detail.pages.display.fields.label")}
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
                  {t("web:pages.settings.roles.detail.pages.display.fields.description")}
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

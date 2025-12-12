import type { UpdateRoleInput } from "@bunstack/shared/contracts/roles";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Route } from "../index";
import { getAllRolesQueryOptions, getRoleByNameQueryOptions } from "@/queries/roles";
import { Button } from "@bunstack/react/components/button";
import { Input } from "@bunstack/react/components/input";
import { Label } from "@bunstack/react/components/label";
import { Spinner } from "@bunstack/react/components/spinner";
import { api } from "@bunstack/react/lib/http";
import { updateRoleInputSchema } from "@bunstack/shared/contracts/roles";

export function Form() {
  const { t } = useTranslation(["common", "web"]);

  const queryClient = useQueryClient();
  const params = Route.useParams();

  const { data } = useQuery(getRoleByNameQueryOptions(params.name));
  const { role } = data!;

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRoleInput }) => {
      const res = await api.roles[":id"].$put({ param: { id: String(id) }, json: data });

      if (!res.ok) {
        throw new Error("Failed to update role");
      }

      return res.json();
    },
    onSuccess: ({ role: data }) => {
      toast.success(`Role successfully updated`);
      queryClient.refetchQueries(getAllRolesQueryOptions);
      queryClient.invalidateQueries({ queryKey: ["get-role-by-name", params.name] });
      queryClient.invalidateQueries({ queryKey: ["get-roles-paginated"] });
      // eslint-disable-next-line ts/no-use-before-define
      form.reset(data);
    },
    onError: () => {
      toast.error("Failed to update role");
    },
  });

  const form = useForm({
    validators: {
      onChange: updateRoleInputSchema,
    },
    defaultValues: {
      label: role.label,
      description: role.description,
    },

    onSubmit: async ({ value }) => mutation.mutate({ id: role.id, data: value }),
  });

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
              <>
                <Label htmlFor={field.name}>{t("dashboard:pages.settings.roles.detail.pages.display.fields.label")}</Label>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  type="label"
                  placeholder="Role"
                  required
                />
                {field.state.meta.isTouched && !field.state.meta.isValid
                  ? (
                      <p className="text-destructive text-sm">
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )
                  : null}
              </>
            )}
          />
        </div>
        <div className="grid gap-3">
          <form.Field
            name="description"
            children={field => (
              <>
                <Label htmlFor={field.name}>{t("dashboard:pages.settings.roles.detail.pages.display.fields.description")}</Label>
                <Input
                  name={field.name}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  type="text"
                  placeholder="Role"
                  required
                />
                {field.state.meta.isTouched && !field.state.meta.isValid
                  ? (
                      <p className="text-destructive text-sm">
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )
                  : null}
              </>
            )}
          />
        </div>
        <form.Subscribe
          selector={state => [state.canSubmit, state.isSubmitting, state.isDefaultValue]}
          children={([canSubmit, isSubmitting, isDefaultValue]) => (
            <>
              <Button type="submit" disabled={!canSubmit || isDefaultValue}>
                { isSubmitting
                  ? (
                      <span className="flex items-center space-x-2">
                        <Spinner />
                        {t("form.saving")}
                      </span>
                    )
                  : isDefaultValue ? t("form.noChanges") : t("form.save") }
              </Button>
            </>
          )}
        />
      </div>
    </form>
  );
}

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Route as Layout } from "../../route";
import { Button } from "~react/components/button";
import { Checkbox } from "~react/components/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~react/components/dialog";
import { Field, FieldContent, FieldError, FieldLabel } from "~react/components/field";
import { Spinner } from "~react/components/spinner";
import { api } from "~react/lib/http";
import { AssignRoleMembersSchema } from "~shared/schemas/api/user-roles.schemas";
import { AvatarUser } from "@/components/avatar-user";
import { getRoleByNameQueryOptions } from "@/queries/roles";
import { getUsersQueryOptions } from "@/queries/users";

export function AssignRoleDialog() {
  const { t } = useTranslation(["common", "web"]);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { role: initialRole } = Layout.useLoaderData();
  const { data: { role } } = useQuery({
    ...getRoleByNameQueryOptions(initialRole.name, ["members"]),
    initialData: {
      success: true,
      role: initialRole,
    },
  });

  const { data, isPending } = useQuery(getUsersQueryOptions());

  const availableUsers = data?.users?.filter(u => !role.members?.some(m => m.id === u.id)) || [];

  const mutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const res = await api.roles[":id{[0-9]+}"].members.$post({
        param: { id: role.id.toString() },
        json: { userIds },
      });

      if (!res.ok) {
        throw new Error("Failed to assign users to role");
      }
    },
    onError: () => {
      toast.error("Failed to assign users to role");
    },
    onSuccess: () => {
      toast.success("Users assigned to role successfully");
      queryClient.invalidateQueries({ queryKey: ["get-role-by-name", role.name] });
      setOpen(false);
    },
  });

  const form = useForm({
    validators: { onChange: AssignRoleMembersSchema },
    defaultValues: {
      userIds: [] as string[],
    },
    onSubmit: async ({ value }) => {
      if (value.userIds.length === 0) {
        toast.error("Please select at least one user");
        return;
      }
      mutation.mutate(value.userIds);
    },
  });

  const handleOpenChange = (open: boolean) => {
    form.reset();
    setOpen(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>{t("web:pages.settings.roles.detail.pages.members.addMembers.label")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("web:pages.settings.roles.detail.pages.members.addMembers.label")}</DialogTitle>
          <DialogDescription>
            Select users to assign to this role
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          {isPending || !data
            ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              )
            : availableUsers.length === 0
              ? (
                  <div className="py-8 text-center text-muted-foreground">
                    All users are already assigned to this role
                  </div>
                )
              : (
                  <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                    <form.Field
                      name="userIds"
                      children={field => (
                        <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                          <FieldContent>
                            <div className="space-y-3">
                              {availableUsers.map(user => (
                                <div key={user.id} className="flex items-center space-x-3">
                                  <Checkbox
                                    id={user.id}
                                    checked={field.state.value.includes(user.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.state.value;
                                      if (checked) {
                                        field.handleChange([...currentValue, user.id]);
                                      } else {
                                        field.handleChange(currentValue.filter((id: string) => id !== user.id));
                                      }
                                    }}
                                  />
                                  <AvatarUser {...user} size="sm" />
                                  <FieldLabel
                                    htmlFor={user.id}
                                    className="text-sm font-normal cursor-pointer flex-1"
                                  >
                                    {user.name}
                                  </FieldLabel>
                                </div>
                              ))}
                            </div>
                            <FieldError errors={field.state.meta.errors} />
                          </FieldContent>
                        </Field>
                      )}
                    />
                  </div>
                )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              {t("common:actions.cancel")}
            </Button>
            <form.Subscribe
              selector={state => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || mutation.isPending || availableUsers.length === 0}
                >
                  {isSubmitting || mutation.isPending
                    ? (
                        <span className="flex items-center space-x-2">
                          <Spinner />
                          <span>{t("common:form.saving")}</span>
                        </span>
                      )
                    : (
                        t("web:pages.settings.roles.detail.pages.members.addMembers.label")
                      )}
                </Button>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

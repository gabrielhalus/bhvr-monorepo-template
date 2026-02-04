import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ShieldIcon, UserPlusIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { roleQueryOptions } from "@/api/roles/roles.queries";
import { AvatarUser } from "@/components/avatar-user";
import { usePaginatedUsers } from "@/hooks/users/use-paginated-users";
import { Button } from "~react/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~react/components/dialog";
import { Field, FieldContent, FieldError } from "~react/components/field";
import { Spinner } from "~react/components/spinner";
import { api } from "~react/lib/http";
import { cn } from "~react/lib/utils";
import { AssignRoleMembersSchema } from "~shared/schemas/api/user-roles.schemas";

import { Route as Layout } from "../../route";

export function AssignRoleDialog() {
  const { t } = useTranslation(["common", "web"]);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { role: initialRole } = Layout.useLoaderData();
  const { data: { role } } = useQuery({
    ...roleQueryOptions(initialRole.name),
    initialData: {
      success: true,
      role: initialRole,
    },
  });

  const { data, isLoading } = usePaginatedUsers();

  const availableUsers = data?.filter(u => !role.members?.some(m => m.id === u.id)) ?? [];

  const isDefaultRole = role.isDefault;

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
      toast.error(t("web:pages.roles.detail.pages.members.assignError"));
    },
    onSuccess: () => {
      toast.success(t("web:pages.roles.detail.pages.members.assignSuccess"));
      queryClient.refetchQueries({ queryKey: ["roles", "members"] });

      setOpen(false);
    },
  });

  const form = useForm({
    validators: { onChange: AssignRoleMembersSchema },
    defaultValues: {
      userIds: [] as string[],
    },
    onSubmit: async ({ value }) => {
      if (!value.userIds.length) {
        toast.error(t("web:pages.roles.detail.pages.members.selectAtLeastOne"));
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
        <Button>
          <UserPlusIcon />
          {t("web:pages.roles.detail.pages.members.addMembers.label")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("web:pages.roles.detail.pages.members.addMembers.label")}
          </DialogTitle>
          <DialogDescription>
            {t("web:pages.roles.detail.pages.members.addMembers.description", { role: role.label })}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          {isDefaultRole
            ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <ShieldIcon className="size-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{t("web:pages.roles.detail.pages.members.defaultRole")}</p>
                  <p className="mt-1 max-w-65 text-sm text-muted-foreground">
                    {t("web:pages.roles.detail.pages.members.defaultRoleDescription")}
                  </p>
                </div>
              )
            : isLoading || !data
              ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner className="size-6" />
                  </div>
                )
              : !availableUsers?.length
                  ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                          <UsersIcon className="size-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">{t("web:pages.roles.detail.pages.members.allUsersAssigned")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t("web:pages.roles.detail.pages.members.allUsersAssignedDescription")}
                        </p>
                      </div>
                    )
                  : (
                      <div className="py-2">
                        <form.Field
                          name="userIds"
                          children={field => (
                            <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                              <FieldContent>
                                <div className="-mx-2 max-h-72 space-y-1 overflow-y-auto px-2">
                                  {availableUsers.map((user, index) => {
                                    const isSelected = field.state.value.includes(user.id);
                                    return (
                                      <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => {
                                          const currentValue = field.state.value;
                                          if (isSelected) {
                                            field.handleChange(currentValue.filter((id: string) => id !== user.id));
                                          } else {
                                            field.handleChange([...currentValue, user.id]);
                                          }
                                        }}
                                        className={cn(
                                          "group flex w-full items-center gap-3 rounded-lg first:mt-px last:mb-px px-3 py-2.5 text-left transition-all duration-200",
                                          "hover:bg-accent/50",
                                          isSelected && "bg-primary/5 ring-1 ring-primary/20",
                                        )}
                                        style={{ animationDelay: `${index * 30}ms` }}
                                      >
                                        <div className="relative">
                                          <AvatarUser {...user} size="default" />
                                          <div
                                            className={cn(
                                              "absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-background transition-all duration-200",
                                              isSelected
                                                ? "bg-primary text-primary-foreground scale-100"
                                                : "bg-muted scale-0 group-hover:scale-100",
                                            )}
                                          >
                                            <CheckIcon className="size-2.5" />
                                          </div>
                                        </div>
                                        <div className="flex-1 truncate">
                                          <p className="truncate text-sm font-medium">{user.name}</p>
                                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                        {isSelected && (
                                          <div className="shrink-0 text-xs font-medium text-primary">
                                            {t("web:pages.roles.detail.pages.members.selected")}
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                                <FieldError errors={field.state.meta.errors} />
                              </FieldContent>
                            </Field>
                          )}
                        />
                        <form.Subscribe
                          selector={state => state.values.userIds}
                          children={userIds => userIds.length > 0 && (
                            <div className="mt-3 flex items-center justify-between border-t pt-3">
                              <span className="text-sm text-muted-foreground">
                                {t("web:pages.roles.detail.pages.members.usersSelected", { count: userIds.length })}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => form.setFieldValue("userIds", [])}
                              >
                                {t("web:pages.roles.detail.pages.members.clearSelection")}
                              </Button>
                            </div>
                          )}
                        />
                      </div>
                    )}
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              {t("common:actions.cancel")}
            </Button>
            <form.Subscribe
              selector={state => [state.canSubmit, state.isSubmitting, state.values.userIds] as const}
              children={([canSubmit, isSubmitting, userIds]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || mutation.isPending || !userIds?.length || isDefaultRole}
                >
                  {isSubmitting || mutation.isPending
                    ? (
                        <>
                          <Spinner />
                          <span>{t("common:form.saving")}</span>
                        </>
                      )
                    : (
                        <>
                          <UserPlusIcon />
                          <span>
                            {(userIds as string[]).length > 0
                              ? t("web:pages.roles.detail.pages.members.assignWithCount", { count: (userIds as string[]).length })
                              : t("web:pages.roles.detail.pages.members.assign")}
                          </span>
                        </>
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

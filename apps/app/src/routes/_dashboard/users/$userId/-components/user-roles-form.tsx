import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Fg, FormSection, SecFoot } from "@/components/form-kit";
import { useRoles } from "@/hooks/roles/use-roles";
import { useUpdateUserRoles } from "@/hooks/users/use-update-user-roles";
import { useUsersRelations } from "@/hooks/users/use-users-relations";
import { Button } from "~orbit/components/ui/Button";
import { Loader2, Plus, Save, Shield, X } from "~orbit/components/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "~orbit/components/ui/Popover";

type UserRolesFormProps = {
  userId: string;
};

export function UserRolesForm({ userId }: UserRolesFormProps) {
  const { t } = useTranslation("web");

  const mutation = useUpdateUserRoles();

  const userRolesQuery = useUsersRelations([userId], ["roles"]);
  const rolesQuery = useRoles();

  const [addOpen, setAddOpen] = useState(false);

  const roleLabel = (name: string) => t(`roles.names.${name}`, { defaultValue: name });

  const defaultRoles = useMemo(
    () => rolesQuery.data?.roles?.filter(role => role.isDefault) ?? [],
    [rolesQuery.data],
  );

  const nonDefaultRoles = useMemo(
    () => rolesQuery.data?.roles?.filter(role => !role.isDefault) ?? [],
    [rolesQuery.data],
  );

  const nonDefaultUserRoleIds = useMemo<number[]>(() => {
    const roles = userRolesQuery.data?.relations?.[userId]?.roles;
    if (!roles) {
      return [];
    }

    return roles
      .filter(role => !role.isDefault)
      .map(role => role.id);
  }, [userRolesQuery.data, userId]);

  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(nonDefaultUserRoleIds);

  useEffect(() => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setSelectedRoleIds((prev) => {
      if (prev.length === nonDefaultUserRoleIds.length && prev.every((id, i) => id === nonDefaultUserRoleIds[i])) {
        return prev;
      }
      return nonDefaultUserRoleIds;
    });
  }, [nonDefaultUserRoleIds]);

  const handleSubmit = () => {
    mutation.mutate({ id: userId, roleIds: selectedRoleIds });
  };

  const hasChanges = JSON.stringify([...selectedRoleIds].sort()) !== JSON.stringify([...nonDefaultUserRoleIds].sort());

  if (defaultRoles.length === 0 && nonDefaultRoles.length === 0) {
    return null;
  }

  const selectedRoles = nonDefaultRoles.filter(role => selectedRoleIds.includes(role.id));
  const availableRoles = nonDefaultRoles.filter(role => !selectedRoleIds.includes(role.id));

  const addRole = (id: number) => {
    setSelectedRoleIds(prev => [...prev, id]);
    setAddOpen(false);
  };
  const removeRole = (id: number) => setSelectedRoleIds(prev => prev.filter(v => v !== id));

  return (
    <FormSection
      flush
      index={<Shield />}
      title={t("users.detail.sections.roles.title")}
      sub={t("users.detail.sections.roles.description")}
    >
      <div className="p-5">
        <Fg label={t("users.invite.rolesLabel")} hint={t("users.detail.sections.roles.defaultHint")}>
          <div className="flex min-h-9.5 flex-wrap items-center gap-2 rounded-lg border border-line bg-surface p-2">
            {selectedRoles.map(role => (
              <span key={role.id} className="inline-flex items-center gap-1.5 rounded-md bg-accent-soft py-1 pl-2.5 pr-1.5 text-xs font-semibold text-[#5a3ee0]">
                {roleLabel(role.name)}
                <button
                  type="button"
                  aria-label={t("actions.delete")}
                  className="grid place-items-center rounded-sm opacity-65 transition-opacity hover:opacity-100 disabled:opacity-30"
                  disabled={mutation.isPending}
                  onClick={() => removeRole(role.id)}
                >
                  <X className="size-3" strokeWidth={2.4} />
                </button>
              </span>
            ))}

            {defaultRoles.map(role => (
              <span key={role.id} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 py-1 pl-2.5 pr-2 text-xs font-medium text-muted">
                {roleLabel(role.name)}
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">{t("users.detail.sections.roles.defaultBadge")}</span>
              </span>
            ))}

            {availableRoles.length > 0 && (
              <Popover open={addOpen} onOpenChange={setAddOpen}>
                <PopoverTrigger asChild disabled={mutation.isPending}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-dashed border-line px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
                  >
                    <Plus className="size-3" strokeWidth={2.4} />
                    {t("users.detail.sections.roles.addRole")}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-1" align="start">
                  <div className="max-h-60 overflow-y-auto">
                    {availableRoles.map(role => (
                      <button
                        key={role.id}
                        type="button"
                        className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-ink outline-none transition-colors hover:bg-surface-2"
                        onClick={() => addRole(role.id)}
                      >
                        {roleLabel(role.name)}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </Fg>
      </div>

      <SecFoot note={hasChanges ? t("users.detail.sections.roles.pending") : t("form.noChanges")}>
        <Button size="sm" onClick={handleSubmit} disabled={!hasChanges || mutation.isPending}>
          {mutation.isPending
            ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {t("form.saving")}
                </>
              )
            : (
                <>
                  <Save className="size-3.5" />
                  {t("actions.save")}
                </>
              )}
        </Button>
      </SecFoot>
    </FormSection>
  );
}

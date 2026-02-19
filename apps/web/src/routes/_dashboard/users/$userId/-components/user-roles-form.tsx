import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useRoles } from "@/hooks/roles/use-roles";
import { useUpdateUserRoles } from "@/hooks/users/use-update-user-roles";
import { useUsersRelations } from "@/hooks/users/use-users-relations";
import { Button } from "~react/components/button";
import { MultiSelect } from "~react/components/multi-select";
import { Spinner } from "~react/components/spinner";

type UserRolesFormProps = {
  userId: string;
};

export function UserRolesForm({ userId }: UserRolesFormProps) {
  const { t } = useTranslation(["common", "web"]);

  const mutation = useUpdateUserRoles();

  const userRolesQuery = useUsersRelations([userId], ["roles"]);
  const rolesQuery = useRoles();

  const nonDefaultRoles = useMemo(
    () => {
      const roles = rolesQuery.data?.roles;
      if (!roles) {
        return [];
      }

      return roles.filter(role => !role.isDefault);
    },
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

  if (nonDefaultRoles.length === 0) {
    return null;
  }

  const roleOptions = nonDefaultRoles.map(role => ({
    value: role.id,
    label: t(`web:pages.roles.names.${role.name}`, { defaultValue: role.name }),
  }));

  return (
    <div>
      <div className="px-6 py-5">
        <h3 className="font-bold leading-none">{t("web:pages.users.detail.sections.roles.title")}</h3>
        <p className="text-muted-foreground text-sm mt-1.5">{t("web:pages.users.detail.sections.roles.description")}</p>
      </div>
      <div className="px-6 py-5 border-t border-border space-y-4">
        <MultiSelect
          options={roleOptions}
          value={selectedRoleIds}
          onChange={setSelectedRoleIds}
          placeholder={t("web:pages.users.invite.rolesPlaceholder")}
          disabled={mutation.isPending}
        />

        <Button
          onClick={handleSubmit}
          disabled={!hasChanges || mutation.isPending}
        >
          {mutation.isPending
            ? (
                <>
                  <Spinner />
                  <span>{t("common:actions.saving")}</span>
                </>
              )
            : t("common:actions.save")}
        </Button>
      </div>
    </div>
  );
}

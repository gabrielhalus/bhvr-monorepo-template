import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useRoles } from "@/hooks/roles/use-roles";
import { useUpdateUserRoles } from "@/hooks/users/use-update-user-roles";
import { useUser } from "@/hooks/users/use-user";
import { Button } from "~react/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~react/components/card";
import { MultiSelect } from "~react/components/multi-select";
import { Spinner } from "~react/components/spinner";

type UserRolesFormProps = {
  userId: string;
};

export function UserRolesForm({ userId }: UserRolesFormProps) {
  const { t } = useTranslation(["common", "web"]);

  const userQuery = useUser(userId);
  const { data: rolesData } = useRoles();
  const mutation = useUpdateUserRoles();

  const roles = rolesData?.roles ?? [];
  const nonDefaultRoles = roles.filter(role => !role.isDefault);
  const userRoleIds = userQuery.data?.user?.roles?.map(r => r.id) ?? [];
  const nonDefaultUserRoleIds = userRoleIds.filter(id => nonDefaultRoles.some(r => r.id === id));

  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  useEffect(() => {
    setSelectedRoleIds(nonDefaultUserRoleIds);
  }, [userQuery.data?.user?.roles]);

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
    <Card>
      <CardHeader>
        <CardTitle>{t("web:pages.users.detail.sections.roles.title")}</CardTitle>
        <CardDescription>{t("web:pages.users.detail.sections.roles.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}

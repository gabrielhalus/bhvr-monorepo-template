import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { getRolesQueryOptions } from "@/queries/roles";
import { DataTable } from "~react/components/data-table";

import { columns } from "./-components/columns";

export const Route = createFileRoute("/_dashboard/settings/roles/")({
  component: Roles,
});

function Roles() {
  const { t } = useTranslation("web");

  const { isPending, data } = useQuery(getRolesQueryOptions(["members"]));

  return (
    <div className="w-full py-10 px-10">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{t("pages.settings.roles.list.title")}</h1>
          <p className="text-muted-foreground">{t("pages.settings.roles.list.subtitle")}</p>
        </div>
        <DataTable
          columns={columns}
          data={data?.roles}
          isLoading={isPending}
          searchPlaceholder="Search roles..."
        />
      </div>
    </div>
  );
}

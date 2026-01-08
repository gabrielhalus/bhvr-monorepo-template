import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { getUsersQueryOptions } from "@/queries/users";
import { DataTable } from "~react/components/data-table";

import { columns } from "./-components/columns";

export const Route = createFileRoute("/_dashboard/users/")({
  component: Users,
});

function Users() {
  const { t } = useTranslation("web");

  const { isPending, data } = useQuery(
    getUsersQueryOptions(["roles"]),
  );

  return (
    <div className="w-full py-10 px-10">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{t("pages.users.list.title")}</h1>
          <p className="text-muted-foreground">{t("pages.users.list.subtitle")}</p>
        </div>
        <DataTable
          columns={columns}
          data={data?.users}
          isLoading={isPending}
          searchPlaceholder="Search users..."
        />
      </div>
    </div>
  );
}

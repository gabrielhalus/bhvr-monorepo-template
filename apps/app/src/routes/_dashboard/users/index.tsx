import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ShellHeader } from "@/components/shell-header";
import { usePaginatedInvitations } from "@/hooks/invitations/use-paginated-invitations";
import { useRoles } from "@/hooks/roles/use-roles";
import { usePaginatedUsers } from "@/hooks/users/use-paginated-users";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "~orbit/components/ui/Breadcrumb";

import { InvitationsDataTable } from "./-components/invitations/invitations.data-table";
import { UsersDataTable } from "./-components/users/users.data-table";

export const Route = createFileRoute("/_dashboard/users/")({
  component: Users,
});

function Users() {
  const { t } = useTranslation("web");

  const usersQuery = usePaginatedUsers();
  const invitationsQuery = usePaginatedInvitations();
  const rolesQuery = useRoles();

  const membersTotal = usersQuery.pagination?.total ?? 0;
  const invitationsTotal = invitationsQuery.pagination?.total ?? 0;
  const rolesTotal = rolesQuery.data?.roles?.length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-4 px-4 py-6 md:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/">{t("home.title")}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("users.title")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ShellHeader
        eyebrow={t("users.eyebrow", { count: membersTotal })}
        title={t("users.title")}
        kpis={[
          { label: t("users.stats.members"), value: String(membersTotal) },
          { label: t("users.stats.invitations"), value: String(invitationsTotal) },
          { label: t("users.stats.roles"), value: String(rolesTotal) },
        ]}
      />

      <UsersDataTable />
      <InvitationsDataTable />
    </div>
  );
}

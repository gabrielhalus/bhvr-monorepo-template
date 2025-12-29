import type { RoleWithRelations } from "@bunstack/shared/types/roles.types";
import type { LinkOptions } from "@tanstack/react-router";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Route } from "../route";
import { getRoleByNameQueryOptions } from "@/queries/roles";
import { Button } from "@bunstack/react/components/button";

export function Nav() {
  const { t } = useTranslation("web");

  const { role } = Route.useLoaderData();

  const query = useQuery({
    ...getRoleByNameQueryOptions(role.name, ["members"]),
    initialData: { success: true, role },
  });

  const nav = (role: RoleWithRelations<["members"]>) => [
    {
      label: t("pages.settings.roles.detail.nav.display"),
      linkOptions: {
        to: "/settings/roles/$name",
        params: { name: role.name },
      } as LinkOptions,
    },
    {
      label: t("pages.settings.roles.detail.nav.members", { count: role.members?.length }),
      linkOptions: {
        to: "/settings/roles/$name/members",
        params: { name: role.name },
      } as LinkOptions,
    },
    {
      label: t("pages.settings.roles.detail.nav.permissions"),
      linkOptions: {
        to: "/settings/roles/$name/permissions",
        params: { name: role.name },
      } as LinkOptions,
    },
  ];

  return (
    <nav className="flex items-center space-x-2 text-sm">
      {nav(query.data.role).map(link => (
        <Button
          key={`${link.label}-${link.linkOptions.to}`}
          asChild
          variant="ghost"
          size="sm"
        >
          <Link
            {...link.linkOptions}
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-accent" }}
          >
            {link.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}

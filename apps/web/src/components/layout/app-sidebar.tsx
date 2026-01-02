import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Box, Home, ShieldUser, UsersRound } from "lucide-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { NavSettings } from "./nav-settings";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@bunstack/react/components/sidebar";
import { authorizeQueryOptions } from "@bunstack/react/queries/auth";
import { NavMain } from "@bunstack/web/components/layout/nav-main";
import { NavUser } from "@bunstack/web/components/layout/nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation("web");

  const { data: canListUsers } = useQuery(authorizeQueryOptions("user:list"));
  const { data: canListRoles } = useQuery(authorizeQueryOptions("role:list"));

  const data = useMemo(() => {
    const navSettings = [];

    if (canListUsers) {
      navSettings.push({
        title: t("pages.settings.users.title"),
        icon: UsersRound,
        href: { to: "/settings/users" } as const,
      });
    }

    if (canListRoles) {
      navSettings.push({
        title: t("pages.settings.roles.title"),
        icon: ShieldUser,
        href: { to: "/settings/roles" } as const,
      });
    }

    return {
      navMain: [
        {
          title: t("pages.home.title"),
          icon: Home,
          href: { to: "/" } as const,
        },
      ],
      navSettings,
    };
  }, [t, canListUsers, canListRoles]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Box className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{t("common:core.name")}</span>
                  <span className="truncate text-xs">{t("common:core.caption")}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSettings items={data.navSettings} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Box, CogIcon, Home, Mail, ShieldUser, UsersRound } from "lucide-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "~react/components/sidebar";
import { authorizeQueryOptions } from "~react/queries/auth";

import { NavSettings } from "./nav-settings";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation("web");

  const { data: canListUsers } = useQuery(authorizeQueryOptions("user:list"));
  const { data: canListInvitations } = useQuery(authorizeQueryOptions("invitation:list"));
  const { data: canListRoles } = useQuery(authorizeQueryOptions("role:list"));
  const { data: canListConfigs } = useQuery(authorizeQueryOptions("runtimeConfig:list"));

  const data = useMemo(() => {
    const navSettings = [];

    if (canListUsers) {
      navSettings.push({
        title: t("pages.users.title"),
        icon: UsersRound,
        href: { to: "/users" } as const,
      });
    }

    if (canListInvitations) {
      navSettings.push({
        title: "Invitations",
        icon: Mail,
        href: { to: "/invitations" } as const,
      });
    }

    if (canListRoles) {
      navSettings.push({
        title: t("pages.roles.title"),
        icon: ShieldUser,
        href: { to: "/roles" } as const,
      });
    }

    if (canListConfigs) {
      navSettings.push({
        title: t("pages.settings.title"),
        icon: CogIcon,
        href: { to: "/settings" } as const,
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
  }, [t, canListUsers, canListInvitations, canListRoles, canListConfigs]);

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

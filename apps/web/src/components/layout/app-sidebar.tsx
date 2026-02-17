import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Box, CogIcon, Home, ScrollTextIcon, UsersRound } from "lucide-react";
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
  const { data: canListConfigs } = useQuery(authorizeQueryOptions("runtimeConfig:list"));
  const { data: canListAuditLogs } = useQuery(authorizeQueryOptions("auditLog:list"));

  const data = useMemo(() => {
    const navSettings = [];

    if (canListUsers) {
      navSettings.push({
        title: t("pages.users.title"),
        icon: UsersRound,
        href: { to: "/users" } as const,
      });
    }

    if (canListAuditLogs) {
      navSettings.push({
        title: t("pages.logs.title"),
        icon: ScrollTextIcon,
        href: { to: "/logs" } as const,
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
  }, [t, canListUsers, canListConfigs, canListAuditLogs]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div
                  className="flex aspect-square size-8 items-center justify-center rounded-lg shrink-0"
                  style={{ background: "linear-gradient(135deg, oklch(0.660 0.228 38), oklch(0.580 0.228 30))" }}
                >
                  <Box className="size-4 text-white" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold tracking-tight">{t("common:core.name")}</span>
                  <span className="truncate text-xs" style={{ color: "oklch(0.640 0.222 42 / 0.65)" }}>{t("common:core.caption")}</span>
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

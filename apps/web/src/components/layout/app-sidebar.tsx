import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Box, CalendarClockIcon, CogIcon, Home, ScrollTextIcon, UsersRound } from "lucide-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarTrigger } from "~react/components/sidebar";
import { authorizeBatchQueryOptions } from "~react/queries/auth";

import { NavSettings } from "./nav-settings";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation("web");

  const { data: sidebarAuth } = useQuery(
    authorizeBatchQueryOptions([
      { permission: "user:list" },
      { permission: "runtimeConfig:list" },
      { permission: "auditLog:list" },
      { permission: "cronTask:list" },
    ]),
  );
  const canListUsers = sidebarAuth?.[0] ?? false;
  const canListConfigs = sidebarAuth?.[1] ?? false;
  const canListAuditLogs = sidebarAuth?.[2] ?? false;
  const canListCronTasks = sidebarAuth?.[3] ?? false;

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

    if (canListCronTasks) {
      navSettings.push({
        title: t("pages.cron.title"),
        icon: CalendarClockIcon,
        href: { to: "/cron" } as const,
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
  }, [t, canListUsers, canListConfigs, canListAuditLogs, canListCronTasks]);

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Header: brand + collapse trigger + search */}
      <SidebarHeader className="border-b border-sidebar-border/40 px-3 py-3">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          {/* Brand link — hidden in icon-collapsed mode */}
          <Link
            to="/"
            className="flex items-center gap-2.5 flex-1 min-w-0 group-data-[collapsible=icon]:hidden"
          >
            <div className="flex size-8 items-center justify-center rounded-lg shrink-0 brand-gradient">
              <Box className="size-4 text-white" />
            </div>
            <div className="grid text-left text-sm leading-tight min-w-0">
              <span className="truncate font-bold tracking-tight text-sidebar-accent-foreground">
                {t("common:core.name")}
              </span>
              <span className="truncate text-[11px] text-primary/65">
                {t("common:core.caption")}
              </span>
            </div>
          </Link>

          {/* Collapse / expand trigger — always visible */}
          <SidebarTrigger className="shrink-0 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors" />
        </div>
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

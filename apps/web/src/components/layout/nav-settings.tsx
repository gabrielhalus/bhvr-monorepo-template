import type { LinkOptions } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { Link, useMatchRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "~react/components/sidebar";
import { cn } from "~react/lib/utils";

export function NavSettings({ items }: { items: { title: string; icon: LucideIcon; href: LinkOptions }[] }) {
  const { t } = useTranslation("web");
  const matchRoute = useMatchRoute();

  if (!items?.length) {
    return;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("pages.settings.title")}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = !!matchRoute({
            ...item.href,
            fuzzy: true,
          });

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                <Link {...item.href}>
                  <item.icon className={cn(
                    "size-4 shrink-0 transition-colors",
                    isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50",
                  )} />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

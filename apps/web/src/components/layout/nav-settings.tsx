import type { LinkOptions } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { Link, useMatchRoute } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~react/components/collapsible";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "~react/components/sidebar";

export function NavSettings({ items }: { items: { title: string; icon: LucideIcon; href: LinkOptions; items?: { title: string; href: LinkOptions }[] }[] }) {
  const { t } = useTranslation("web");

  const matchRoute = useMatchRoute();

  if (!items.length) {
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
            <Collapsible key={item.title} asChild defaultOpen={isActive}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                  <Link {...item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items?.length
                  ? (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuAction className="data-[state=open]:rotate-90">
                            <ChevronRight />
                            <span className="sr-only">{t("pages.nav.toggle")}</span>
                          </SidebarMenuAction>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items?.map(subItem => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <Link {...subItem.href}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    )
                  : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

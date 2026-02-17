import { Link } from "@tanstack/react-router";
import { User2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocaleSubmenu } from "@/components/layout/locale-submenu";
import { LogoutButton } from "@/components/layout/logout-button";
import { ThemeSubmenu } from "@/components/layout/theme-submenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~react/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~react/components/sidebar";
import { useAuth } from "~react/hooks/use-auth";

import { AvatarUser } from "../avatar-user";

export function NavUser() {
  const { t } = useTranslation("web");
  const { isMobile } = useSidebar();
  const { user, authenticated } = useAuth();

  if (!authenticated) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:text-sidebar-accent-foreground rounded-xl">
              <AvatarUser {...user} />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/50">{user.email}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <AvatarUser {...user} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link to="/account">
                <User2 />
                {t("pages.nav.myAccount")}
              </Link>
            </DropdownMenuItem>

            <LocaleSubmenu />
            <ThemeSubmenu />

            <DropdownMenuSeparator />
            <LogoutButton variant="dropdown" />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

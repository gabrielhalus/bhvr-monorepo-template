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
import { parseUserName } from "~react/lib/name-utils";
import { useAuth } from "~react/hooks/use-auth";

import { AvatarUser } from "../avatar-user";

export function NavUser() {
  const { t } = useTranslation("web");
  const { isMobile } = useSidebar();
  const { user, authenticated } = useAuth();

  if (!authenticated) {
    return null;
  }

  const { fullName } = parseUserName(user.name);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent rounded-xl gap-3 h-auto py-2.5 transition-colors"
            >
              <AvatarUser {...user} size="lg" />
              <div className="grid flex-1 text-left leading-tight min-w-0">
                <span className="truncate font-semibold text-sm">{fullName}</span>
                <span className="truncate text-xs text-sidebar-foreground/45">{user.email}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2.5 px-2 py-2 text-left">
                <AvatarUser {...user} size="lg" />
                <div className="grid flex-1 text-left leading-tight min-w-0">
                  <span className="truncate font-semibold text-sm">{fullName}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
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

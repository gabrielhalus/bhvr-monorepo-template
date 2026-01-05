import type { LucideIcon } from "lucide-react";

import { Languages, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

import { LogoutButton } from "@/components/layout/logout-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~react/components/dropdown-menu";
import { Separator } from "~react/components/separator";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~react/components/sidebar";
import { useAuth } from "~react/hooks/use-auth";
import { cn } from "~react/lib/utils";

import { AvatarUser } from "../avatar-user";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, authenticated } = useAuth();
  const { t, i18n } = useTranslation("common");
  const { theme, setTheme } = useTheme();

  const locales = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
  ];

  const currentLocale = locales.find(locale => locale.code === i18n.language) || locales[0];

  type ThemeValue = "system" | "light" | "dark" | "modern-minimal-light" | "modern-minimal-dark";
  type ThemeOption = {
    value: ThemeValue;
    label: string;
    icon: LucideIcon;
  };

  const systemThemes: ThemeOption[] = [
    { value: "system", label: t("generic.themeSystem"), icon: Monitor },
  ] as const;

  const lightThemes: ThemeOption[] = [
    { value: "light", label: t("generic.themeLight"), icon: Sun },
    { value: "modern-minimal-light", label: t("generic.themeModernMinimalLight"), icon: Sun },
  ] as const;

  const darkThemes: ThemeOption[] = [
    { value: "dark", label: t("generic.themeDark"), icon: Moon },
    { value: "modern-minimal-dark", label: t("generic.themeModernMinimalDark"), icon: Moon },
  ] as const;

  const themeOptions = [...systemThemes, ...lightThemes, ...darkThemes];

  const currentThemeValue: ThemeValue = (theme as ThemeValue | undefined) ?? "system";
  const currentTheme = themeOptions.find(option => option.value === currentThemeValue) ?? themeOptions[0] as ThemeOption;
  const CurrentThemeIcon = currentTheme.icon;

  const handleLocaleChange = (localeCode: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    i18n.changeLanguage(localeCode);
  };

  const handleThemeChange = (themeValue: ThemeValue, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setTheme(themeValue);
  };

  if (!authenticated) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <AvatarUser {...user} />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
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

            {/* Locale submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2">
                <Languages className="size-4 text-muted-foreground" />
                {t("generic.language", { lang: currentLocale?.name })}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {locales.map(locale => (
                  <DropdownMenuItem
                    key={locale.code}
                    onClick={event => handleLocaleChange(locale.code, event)}
                    className={cn("flex items-center gap-2", i18n.language === locale.code && "bg-accent")}
                  >
                    <span className="text-sm">{locale.flag}</span>
                    <span className="text-sm">{locale.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Theme submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2">
                <CurrentThemeIcon className="size-4 text-muted-foreground" />
                {t("generic.theme", { theme: currentTheme.label })}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  {systemThemes.map((option) => {
                    const isActive = option.value === currentThemeValue;
                    const OptionIcon = option.icon;

                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={event => handleThemeChange(option.value, event)}
                        className={`flex items-center gap-2 ${isActive ? "bg-accent text-accent-foreground" : ""}`}
                      >
                        <OptionIcon className="size-4 text-muted-foreground" />
                        <span className="text-sm">{option.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
                <Separator className="my-1" />
                <DropdownMenuGroup>
                  {lightThemes.map((option) => {
                    const isActive = option.value === currentThemeValue;
                    const OptionIcon = option.icon;

                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={event => handleThemeChange(option.value, event)}
                        className={`flex items-center gap-2 ${isActive ? "bg-accent text-accent-foreground" : ""}`}
                      >
                        <OptionIcon className="size-4 text-muted-foreground" />
                        <span className="text-sm">{option.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
                <Separator className="my-1" />
                <DropdownMenuGroup>
                  {darkThemes.map((option) => {
                    const isActive = option.value === currentThemeValue;
                    const OptionIcon = option.icon;

                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={event => handleThemeChange(option.value, event)}
                        className={`flex items-center gap-2 ${isActive ? "bg-accent text-accent-foreground" : ""}`}
                      >
                        <OptionIcon className="size-4 text-muted-foreground" />
                        <span className="text-sm">{option.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <LogoutButton variant="dropdown" />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

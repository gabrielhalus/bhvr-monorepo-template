import type { LucideIcon } from "lucide-react";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "~react/components/dropdown-menu";
import { Separator } from "~react/components/separator";
import { cn } from "~react/lib/utils";

export function ThemeSubmenu() {
  const { t } = useTranslation("common");
  const { theme, setTheme } = useTheme();

  type ThemeValue = "system" | "light" | "dark";
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
  ] as const;

  const darkThemes: ThemeOption[] = [
    { value: "dark", label: t("generic.themeDark"), icon: Moon },
  ] as const;

  const themeOptions = [...systemThemes, ...lightThemes, ...darkThemes];

  const currentThemeValue: ThemeValue = (theme as ThemeValue | undefined) ?? "system";
  const currentTheme = themeOptions.find(option => option.value === currentThemeValue) ?? themeOptions[0] as ThemeOption;
  const CurrentThemeIcon = currentTheme.icon;

  const handleThemeChange = (themeValue: ThemeValue, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setTheme(themeValue);
  };

  return (
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
                className={cn("flex items-center gap-2 cursor-pointer", isActive ? "bg-accent text-accent-foreground" : "")}
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
                className={cn("flex items-center gap-2 cursor-pointer", isActive ? "bg-accent text-accent-foreground" : "")}
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
                className={cn("flex items-center gap-2 cursor-pointer", isActive ? "bg-accent text-accent-foreground" : "")}
              >
                <OptionIcon className="size-4 text-muted-foreground" />
                <span className="text-sm">{option.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

import type { UserPreferences } from "~shared/schemas/db/users.schemas";

import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useUpdatePreferences } from "@/hooks/preferences/use-update-preferences";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/http";
import sayno from "@/lib/sayno";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "~orbit/components/ui/DropdownMenu";
import { Check, Languages, LogOut, PanelLeft, PanelTop, User } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

const LOCALES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
] as const;

const LAYOUTS = [
  { value: "sidebar", labelKey: "nav.layoutSidebar", icon: PanelLeft },
  { value: "navbar", labelKey: "nav.layoutNavbar", icon: PanelTop },
] as const;

/**
 * Shared user-menu body (account, language, logout). Rendered inside an Orbit
 * `DropdownMenuContent` — used by the desktop sidebar and the mobile shell.
 *
 * No theme switch: Orbit is light-only, so the app ships a clair-only parity.
 */
export function AccountMenuItems() {
  const { t, i18n } = useTranslation("web");
  const { t: tAuth } = useTranslation("auth");
  const navigate = useNavigate();
  const { mutate: updatePreferences } = useUpdatePreferences();
  const { user } = useAuth();

  const currentLocale = LOCALES.find(l => l.code === i18n.language) ?? LOCALES[0];
  const navLayout = (user.preferences as UserPreferences)?.navLayout ?? "sidebar";
  const currentLayout = LAYOUTS.find(l => l.value === navLayout) ?? LAYOUTS[0];

  const logout = useMutation({
    mutationFn: async () => {
      const confirmed = await sayno.confirm({ description: tAuth("logout.dialog") });
      if (!confirmed) return false;
      const res = await api.auth.logout.$post();
      if (!res.ok) throw new Error("Failed to logout");
      return true;
    },
    onSuccess: (loggedOut) => {
      // `manual` keeps SSO auto-login from signing the user right back in.
      if (loggedOut) navigate({ to: "/login", search: { manual: true }, replace: true });
    },
    onError: () => toast.error(tAuth("logout.error")),
  });

  return (
    <>
      <DropdownMenuItem asChild>
        <Link to="/account">
          <User />
          {t("account.title")}
        </Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      {/* Language */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Languages className="text-faint" />
          <span className="flex-1">{t("generic.language")}</span>
          <span className="text-xs uppercase text-muted">{currentLocale.code}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {LOCALES.map((locale) => {
            const active = i18n.language === locale.code;
            return (
              <DropdownMenuItem
                key={locale.code}
                onSelect={(e) => {
                  e.preventDefault();
                  i18n.changeLanguage(locale.code);
                  updatePreferences({ locale: locale.code });
                }}
                className={cn(active && "bg-surface-2")}
              >
                <span>{locale.flag}</span>
                <span className="flex-1">{locale.name}</span>
                {active && <Check className="text-accent" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      {/* Layout */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <currentLayout.icon className="text-faint" />
          <span className="flex-1">{t("nav.layout")}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {LAYOUTS.map((layout) => {
            const active = navLayout === layout.value;
            return (
              <DropdownMenuItem
                key={layout.value}
                onSelect={(e) => {
                  e.preventDefault();
                  updatePreferences({ navLayout: layout.value });
                }}
                className={cn(active && "bg-surface-2")}
              >
                <layout.icon className="text-faint" />
                <span className="flex-1">{t(layout.labelKey)}</span>
                {active && <Check className="text-accent" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      <DropdownMenuItem variant="danger" onSelect={() => logout.mutate()}>
        <LogOut />
        {tAuth("logout.label")}
      </DropdownMenuItem>
    </>
  );
}

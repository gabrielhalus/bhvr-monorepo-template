import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useUpdatePreferences } from "@/hooks/preferences/use-update-preferences";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "~react/components/dropdown-menu";
import { cn } from "~react/lib/utils";

export function LocaleSubmenu() {
  const { t, i18n } = useTranslation("common");
  const { mutate: updatePreferences } = useUpdatePreferences();

  const locales = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
  ];

  const currentLocale = locales.find(locale => locale.code === i18n.language) ?? locales[0];

  const handleLocaleChange = (localeCode: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    i18n.changeLanguage(localeCode);
    updatePreferences({ locale: localeCode });
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex items-center gap-2">
        <Languages className="size-4 text-muted-foreground" />
        {t("generic.language", { lang: currentLocale?.name })}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {locales.map((locale) => {
          const isActive = i18n.language === locale.code;

          return (
            <DropdownMenuItem
              key={locale.code}
              onClick={event => handleLocaleChange(locale.code, event)}
              className={cn("flex items-center gap-2 cursor-pointer", isActive ? "bg-accent text-accent-foreground" : "")}
            >
              <span>{locale.flag}</span>
              <span>{locale.name}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

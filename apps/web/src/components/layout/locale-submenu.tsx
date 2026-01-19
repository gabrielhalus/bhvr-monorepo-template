import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "~react/components/dropdown-menu";
import { cn } from "~react/lib/utils";

export function LocaleSubmenu() {
  const { t, i18n } = useTranslation("common");

  const locales = [
    { code: "de", name: "Deutsch" },
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "it", name: "Italiano" },
    { code: "nl", name: "Nederlands" },
  ];

  const currentLocale = locales.find(locale => locale.code === i18n.language) || locales[0];

  const handleLocaleChange = (localeCode: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    i18n.changeLanguage(localeCode);
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex items-center gap-2">
        <Languages className="size-4 text-muted-foreground" />
        {t("generic.language", { lang: currentLocale?.name })}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-64">
        <div className="grid grid-cols-2 gap-1 p-1">
          {locales.map(locale => (
            <DropdownMenuItem
              key={locale.code}
              onClick={event => handleLocaleChange(locale.code, event)}
              className={cn(
                "flex items-center justify-center px-3 py-2 text-sm cursor-pointer",
                i18n.language === locale.code && "bg-accent text-accent-foreground",
              )}
            >
              {locale.name}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

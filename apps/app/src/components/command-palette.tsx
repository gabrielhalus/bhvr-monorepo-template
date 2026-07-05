import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useNavLinks } from "@/hooks/use-nav-links";
import { Dialog, DialogContent, DialogTitle } from "~orbit/components/ui/Dialog";
import { Search } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

const LAST_CMD_KEY = "cmdPalette.lastValue";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const GROUP_HEADING
  = "**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:text-faint";

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t } = useTranslation("web");
  const navigate = useNavigate();
  const { links, adminLinks } = useNavLinks();
  const lastCmdValue = localStorage.getItem(LAST_CMD_KEY) ?? undefined;

  const lastUsedItem = useMemo(() => {
    if (!lastCmdValue) return null;

    for (const link of links) {
      if (`nav-${String(link.to)}-${t(link.label as never)}` === lastCmdValue) {
        return { value: lastCmdValue, label: t(link.label as never), Icon: link.icon, action: () => navigate({ to: link.to as never }) };
      }
    }

    for (const link of adminLinks) {
      if (`admin-${String(link.to)}-${t(link.label as never)}` === lastCmdValue) {
        return { value: lastCmdValue, label: t(link.label as never), Icon: link.icon, action: () => navigate({ to: link.to as never }) };
      }
    }

    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCmdValue, links, adminLinks]);

  function handleSelect(action: () => void) {
    onOpenChange(false);
    action();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        aria-describedby={undefined}
        className="top-[15vh] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">{t("cmdPalette.title" as never)}</DialogTitle>

        <Command defaultValue={lastCmdValue}>
          {/* Input */}
          <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
            <Search className="size-4 shrink-0 text-muted" />
            <Command.Input
              placeholder={t("cmdPalette.placeholder" as never)}
              className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
            />
            <kbd className="hidden shrink-0 rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-faint sm:block">
              esc
            </kbd>
          </div>

          <Command.List className="max-h-105 overflow-y-auto p-1.5 **:[[cmdk-list-sizer]]:flex **:[[cmdk-list-sizer]]:flex-col **:[[cmdk-list-sizer]]:gap-1">
            <Command.Empty className="py-8 text-center text-sm text-muted">
              {t("cmdPalette.noResults" as never)}
            </Command.Empty>

            {lastUsedItem && (
              <Command.Group heading={t("cmdPalette.lastUsed" as never)} className={GROUP_HEADING}>
                <PaletteItem value={lastUsedItem.value} persist onSelect={() => handleSelect(lastUsedItem.action)}>
                  <lastUsedItem.Icon className="size-4 shrink-0 text-muted" />
                  {lastUsedItem.label}
                </PaletteItem>
              </Command.Group>
            )}

            {links.length > 0 && (
              <Command.Group heading={t("cmdPalette.navigation" as never)} className={GROUP_HEADING}>
                {links.map(link => (
                  <PaletteItem
                    key={String(link.to)}
                    value={`nav-${String(link.to)}-${t(link.label as never)}`}
                    persist
                    onSelect={() => handleSelect(() => navigate({ to: link.to as never }))}
                  >
                    <link.icon className="size-4 shrink-0 text-muted" />
                    {t(link.label as never)}
                  </PaletteItem>
                ))}
              </Command.Group>
            )}

            {adminLinks.length > 0 && (
              <Command.Group heading={t("nav.administration" as never)} className={GROUP_HEADING}>
                {adminLinks.map(link => (
                  <PaletteItem
                    key={String(link.to)}
                    value={`admin-${String(link.to)}-${t(link.label as never)}`}
                    persist
                    onSelect={() => handleSelect(() => navigate({ to: link.to as never }))}
                  >
                    <link.icon className="size-4 shrink-0 text-muted" />
                    {t(link.label as never)}
                  </PaletteItem>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function PaletteItem({
  className,
  children,
  persist,
  onSelect,
  ...props
}: React.ComponentProps<typeof Command.Item> & { persist?: boolean }) {
  function handleSelect(value: string) {
    if (persist) localStorage.setItem(LAST_CMD_KEY, value);
    onSelect?.(value);
  }

  return (
    <Command.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors",
        "data-[selected=true]:bg-surface-2 data-[selected=true]:text-ink",
        className,
      )}
      onSelect={handleSelect}
      {...props}
    >
      {children}
    </Command.Item>
  );
}

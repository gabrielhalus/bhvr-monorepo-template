import { Link, useMatchRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useNavLinks } from "@/hooks/use-nav-links";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~orbit/components/ui/Dialog";
import {
  LayoutDashboard,
  Menu,
  User,
} from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

const BOTTOM_TABS = [
  { to: "/", icon: LayoutDashboard, label: "home.title" },
] as const;

/** Floating bottom navigation for the mobile shell — Orbit clean light style. */
export function MobileNav() {
  const { t } = useTranslation("web");
  const matchRoute = useMatchRoute();
  const { adminLinks } = useNavLinks();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreLinks = [
    ...adminLinks,
    { to: "/account" as const, icon: User, label: "account.title" },
  ];

  return (
    <>
      <nav className="flex items-center gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-raised">
        {BOTTOM_TABS.map((tab) => {
          const active = tab.to === "/"
            ? !!matchRoute({ to: "/", fuzzy: false })
            : !!matchRoute({ to: tab.to, fuzzy: true });
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "relative flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors",
                active ? "bg-surface-2 text-accent" : "text-faint active:text-ink",
              )}
            >
              <tab.icon className="size-4.5" strokeWidth={2} />
              <span>{t(tab.label as never)}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium text-faint transition-colors active:text-ink"
        >
          <Menu className="size-4.5" strokeWidth={2} />
          <span>{t("nav.more" as never)}</span>
        </button>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("nav.more" as never)}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-0.5">
            {moreLinks.map((link) => {
              const Icon = link.icon;
              const active = !!matchRoute({ to: link.to, fuzzy: true });
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-surface-2 text-ink" : "text-muted active:bg-surface-2",
                  )}
                >
                  <Icon className={cn("size-4.5 shrink-0", active ? "text-accent" : "text-faint")} strokeWidth={2} />
                  {t(link.label as never)}
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

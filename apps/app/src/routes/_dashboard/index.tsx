import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ShellHeader } from "@/components/shell-header";
import { useNavLinks } from "@/hooks/use-nav-links";
import { authQueryOptions } from "@/queries/auth";
import { ChevronRight, User } from "~orbit/components/ui/icons";
import { Panel } from "~orbit/components/ui/Panel";

export const Route = createFileRoute("/_dashboard/")({
  component: Dashboard,
});

function getGreeting(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function Dashboard() {
  const { t } = useTranslation("web");
  const greeting = getGreeting(new Date().getHours());

  const { data: session } = useQuery(authQueryOptions);
  const firstName = session?.user?.firstName ?? "";
  const name = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "";

  const { adminLinks } = useNavLinks();

  const shortcuts = [
    ...adminLinks,
    { to: "/account" as const, icon: User, label: "account.title" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-360 flex-col gap-4 p-4 md:p-6">
      <ShellHeader
        eyebrow={t("home.title")}
        title={`${t(`home.greeting.${greeting}` as never)}${name ? `, ${name}` : ""}`}
        accent
      />

      <Panel className="p-2">
        <div className="px-3 pb-1.5 pt-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-faint">
          {t("home.shortcuts.title" as never)}
        </div>
        <div className="grid grid-cols-1 gap-1 p-1 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={String(link.to)}
                to={link.to}
                className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-surface-2"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-muted transition-colors group-hover:text-accent">
                  <Icon className="size-4.5" strokeWidth={2} />
                </span>
                <span className="flex-1 truncate text-sm font-medium text-ink">{t(link.label as never)}</span>
                <ChevronRight className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

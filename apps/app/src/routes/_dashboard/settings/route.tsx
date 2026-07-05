import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { configsQueryOptions } from "@/api/configs/configs.queries";
import { ShellHeader } from "@/components/shell-header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "~orbit/components/ui/Breadcrumb";

import { Sidebar } from "./-components/sidebar";

export const Route = createFileRoute("/_dashboard/settings")({
  component: RouteComponent,
  loader: ({ context }) => context.queryClient.ensureQueryData(configsQueryOptions),
  staticData: { crumb: "settings.title" },
});

function RouteComponent() {
  const { t } = useTranslation("web");

  return (
    <div className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-4 px-4 py-6 md:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/">{t("home.title")}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("settings.title")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ShellHeader eyebrow={t("settings.eyebrow")} title={t("settings.title")} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_1fr]">
        <Sidebar />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

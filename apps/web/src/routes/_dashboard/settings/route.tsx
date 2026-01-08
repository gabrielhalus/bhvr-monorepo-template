import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Sidebar } from "./-components/sidebar";

export const Route = createFileRoute("/_dashboard/settings")({
  component: RouteComponent,
  loader: () => ({
    crumb: "pages.settings.title",
  }),
});

function RouteComponent() {
  const { t } = useTranslation("web");

  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="w-full max-w-3xl m-4 space-y-8">
        <h1>{t("pages.settings.title")}</h1>
        <Outlet />
      </div>
    </div>
  );
}

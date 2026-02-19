import { createFileRoute } from "@tanstack/react-router";
import { UsersRoundIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { InvitationsDataTable } from "./-components/invitations/invitations.data-table";
import { UsersDataTable } from "./-components/users/users.data-table";

export const Route = createFileRoute("/_dashboard/users/")({
  component: Users,
});

function Users() {
  const { t } = useTranslation("web");

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      {/* Hero panel */}
      <div className="relative overflow-hidden rounded-2xl p-7 md:p-9 bg-panel">
        <div className="absolute inset-0 pointer-events-none hero-grid" />
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none bg-primary opacity-[0.18]" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="size-11 rounded-xl flex items-center justify-center shrink-0 bg-primary/20">
            <UsersRoundIcon className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight text-panel-heading">
              {t("pages.users.title")}
            </h1>
            <p className="text-sm mt-0.5 text-panel-meta">
              {t("pages.users.list.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        <UsersDataTable />
        <InvitationsDataTable />
      </div>
    </div>
  );
}

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
      <div
        className="relative overflow-hidden rounded-2xl p-7 md:p-9"
        style={{ background: "oklch(0.138 0.028 32)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.918 0.010 58 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(0.918 0.010 58 / 0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: "oklch(0.640 0.222 42)", opacity: 0.18 }}
        />

        <div className="relative z-10 flex items-center gap-4">
          <div
            className="size-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.640 0.222 42 / 0.20)" }}
          >
            <UsersRoundIcon className="size-5" style={{ color: "oklch(0.640 0.222 42)" }} />
          </div>
          <div>
            <h1
              className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight"
              style={{ color: "oklch(0.925 0.012 55)" }}
            >
              {t("pages.users.title")}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "oklch(0.560 0.022 48)" }}>
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

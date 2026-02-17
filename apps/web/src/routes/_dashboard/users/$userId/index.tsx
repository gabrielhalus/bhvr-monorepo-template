import type { User as _User } from "~shared/types/db/users.types";

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CalendarIcon, MailIcon, ShieldIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { userQueryOptions } from "@/api/users/users.queries";
import { AvatarUser } from "@/components/avatar-user";
import { useUser } from "@/hooks/users/use-user";
import { Badge } from "~react/components/badge";
import { Button } from "~react/components/button";

import { UserInformationsForm } from "./-components/user-informations-form";
import { UserRolesForm } from "./-components/user-roles-form";
import { UserSecurityActions } from "./-components/user-security-actions";
import { UserSessionsCard } from "./-components/user-sessions-card";

export const Route = createFileRoute("/_dashboard/users/$userId/")({
  component: User,
  loader: ({ params, context }) => context.queryClient.ensureQueryData(userQueryOptions(params.userId)),
  staticData: { crumb: (data: { user?: _User }) => data.user?.name },
});

function User() {
  const { t } = useTranslation(["common", "web"]);

  const { userId } = Route.useParams();
  const userQuery = useUser(userId);
  const userData = userQuery.data?.user;

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
          className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: "oklch(0.640 0.222 42)", opacity: 0.18 }}
        />

        <div className="relative z-10 space-y-4">
          {/* Back button row */}
          <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 opacity-70 hover:opacity-100" style={{ color: "oklch(0.560 0.022 48)" }}>
            <Link to="/users">
              <ArrowLeftIcon className="size-3.5" />
              <span className="text-xs font-medium">{t("web:pages.users.title")}</span>
            </Link>
          </Button>

          {/* Profile row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="shrink-0">
              <AvatarUser avatar={userData?.avatar ?? ""} name={userData?.name ?? ""} size="lg" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h1
                  className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight"
                  style={{ color: "oklch(0.925 0.012 55)" }}
                >
                  {userData?.name ?? "—"}
                </h1>
                <div className="flex items-center gap-1.5 mt-1" style={{ color: "oklch(0.560 0.022 48)" }}>
                  <MailIcon className="size-3.5" />
                  <span className="text-sm">{userData?.email ?? "—"}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {userData?.createdAt && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.560 0.022 48)" }}>
                    <CalendarIcon className="size-3.5" />
                    <span>{t("web:pages.users.detail.joinedAt", { date: new Date(userData.createdAt) })}</span>
                  </div>
                )}
                {userData?.verifiedAt && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: "oklch(0.640 0.222 42 / 0.20)", color: "oklch(0.640 0.222 42)" }}
                  >
                    <span className="size-1.5 rounded-full bg-current inline-block" />
                    Verified
                  </span>
                )}
              </div>
              {userData?.roles && userData.roles.length > 0 && (
                <div className="flex items-center gap-2">
                  <ShieldIcon className="size-3.5" style={{ color: "oklch(0.560 0.022 48)" }} />
                  <div className="flex flex-wrap gap-1">
                    {userData.roles.map(role => (
                      <Badge key={role.id} variant={role.isDefault ? "outline" : "secondary"}>
                        {t(`web:pages.roles.names.${role.name}`, { defaultValue: role.name })}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail forms */}
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <UserInformationsForm userId={userId} />
        <UserRolesForm userId={userId} />
        <UserSecurityActions userId={userId} />
        <UserSessionsCard userId={userId} userName={userData?.name ?? ""} />
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { CalendarIcon, MailIcon, ShieldIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AvatarUser } from "@/components/avatar-user";
import { Badge } from "~react/components/badge";
import { useAuth } from "~react/hooks/use-auth";

import { PasswordForm } from "./-components/password-form";
import { SessionsCard } from "./-components/sessions-card";
import { UserInformationsForm } from "./-components/user-informations-form";

export const Route = createFileRoute("/_dashboard/account/")({
  component: Account,
  staticData: { crumb: "pages.account.title" },
});

function Account() {
  const { t } = useTranslation(["common", "web"]);
  const { user } = useAuth();

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

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="shrink-0">
            <AvatarUser avatar={user.avatar} name={user.name} size="lg" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <h1
                className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight"
                style={{ color: "oklch(0.925 0.012 55)" }}
              >
                {user.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-1" style={{ color: "oklch(0.560 0.022 48)" }}>
                <MailIcon className="size-3.5" />
                <span className="text-sm">{user.email}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.560 0.022 48)" }}>
                <CalendarIcon className="size-3.5" />
                <span>{t("web:pages.account.joinedAt", { date: new Date(user.createdAt) })}</span>
              </div>
              {user.verifiedAt && (
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "oklch(0.640 0.222 42 / 0.20)", color: "oklch(0.640 0.222 42)" }}
                >
                  <span className="size-1.5 rounded-full bg-current inline-block" />
                  Verified
                </span>
              )}
            </div>
            {user.roles && user.roles.length > 0 && (
              <div className="flex items-center gap-2">
                <ShieldIcon className="size-3.5" style={{ color: "oklch(0.560 0.022 48)" }} />
                <div className="flex flex-wrap gap-1">
                  {user.roles.map(role => (
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

      {/* Settings forms */}
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <UserInformationsForm userId={user.id} />
        <PasswordForm userId={user.id} />
        <SessionsCard />
      </div>
    </div>
  );
}

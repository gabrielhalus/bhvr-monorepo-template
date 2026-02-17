import { createFileRoute } from "@tanstack/react-router";
import { CalendarIcon, KeyIcon, MailIcon, MonitorIcon, ShieldIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AvatarUser } from "@/components/avatar-user";
import { useAuth } from "~react/hooks/use-auth";

import { PasswordForm } from "./-components/password-form";
import { SessionsCard } from "./-components/sessions-card";
import { UserInformationsForm } from "./-components/user-informations-form";

export const Route = createFileRoute("/_dashboard/account/")({
  component: Account,
  staticData: { crumb: "pages.account.title" },
});

type TabId = "profile" | "password" | "sessions";

const tabs: { id: TabId; icon: typeof UserIcon; labelKey: string }[] = [
  { id: "profile", icon: UserIcon, labelKey: "web:pages.account.sections.profile.title" },
  { id: "password", icon: KeyIcon, labelKey: "web:pages.account.sections.password.title" },
  { id: "sessions", icon: MonitorIcon, labelKey: "web:pages.account.sections.sessions.title" },
];

function Account() {
  const { t } = useTranslation(["common", "web"]);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

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
                    <span
                      key={role.id}
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{
                        background: role.isDefault ? "transparent" : "oklch(0.918 0.010 55 / 0.12)",
                        color: "oklch(0.918 0.010 55 / 0.80)",
                        border: role.isDefault ? "1px solid oklch(0.918 0.010 55 / 0.25)" : "1px solid transparent",
                      }}
                    >
                      {t(`web:pages.roles.names.${role.name}`, { defaultValue: role.name })}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabbed settings layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab navigation */}
        <nav className="flex lg:flex-col gap-1 lg:w-56 shrink-0 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer"
                style={{
                  background: isActive ? "oklch(0.640 0.222 42 / 0.12)" : "transparent",
                  color: isActive ? "oklch(0.640 0.222 42)" : "oklch(0.570 0.020 48)",
                }}
              >
                <Icon className="size-4 shrink-0" />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </nav>

        {/* Active section content */}
        <div className="flex-1 min-w-0 max-w-2xl">
          {activeTab === "profile" && <UserInformationsForm userId={user.id} />}
          {activeTab === "password" && <PasswordForm userId={user.id} />}
          {activeTab === "sessions" && <SessionsCard />}
        </div>
      </div>
    </div>
  );
}

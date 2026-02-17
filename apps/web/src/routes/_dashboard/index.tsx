import { createFileRoute } from "@tanstack/react-router";
import { ActivityIcon, ArrowRightIcon, ServerIcon, ShieldCheckIcon, UsersRoundIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~react/components/card";
import { useAuth } from "~react/hooks/use-auth";

export const Route = createFileRoute("/_dashboard/")({
  component: Dashboard,
});

type StatCardProps = {
  label: string;
  value: string;
  change?: string;
  icon: React.ElementType;
};

function StatCard({ label, value, change, icon: Icon }: StatCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardDescription className="text-xs font-semibold uppercase tracking-widest">{label}</CardDescription>
          <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Icon className="size-3.5" />
          </div>
        </div>
        <CardTitle className="text-4xl font-extrabold tracking-tighter mt-1">{value}</CardTitle>
      </CardHeader>
      {change && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">{change}</p>
        </CardContent>
      )}
    </Card>
  );
}

function Dashboard() {
  const { t } = useTranslation("web");
  const { user } = useAuth();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = user.name.split(" ")[0];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">

      {/* Hero card — toko-inspired dark warm panel with orange accent */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 md:p-10"
        style={{ background: "oklch(0.138 0.028 32)" }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.918 0.010 58 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(0.918 0.010 58 / 0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Ember glow */}
        <div
          className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: "oklch(0.640 0.222 42)", opacity: 0.20 }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "oklch(0.640 0.222 42 / 0.15)",
                color: "oklch(0.640 0.222 42)",
              }}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {t("pages.home.title")}
            </div>
            <h1
              className="text-4xl md:text-5xl font-extrabold leading-[1.05] tracking-tighter"
              style={{ color: "oklch(0.925 0.012 55)" }}
            >
              {greeting},<br />
              {firstName}.
            </h1>
            <p style={{ color: "oklch(0.560 0.022 48)" }} className="text-sm max-w-sm leading-relaxed">
              Here's an overview of your application. All systems are running normally.
            </p>
          </div>

          {/* Quick action */}
          <a
            href="/users"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 shrink-0 self-start md:self-auto"
            style={{
              background: "oklch(0.640 0.222 42)",
              color: "oklch(1 0 0)",
            }}
          >
            Manage Users
            <ArrowRightIcon className="size-4" />
          </a>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Users"
          value="—"
          change="Total registered accounts"
          icon={UsersRoundIcon}
        />
        <StatCard
          label="Sessions"
          value="—"
          change="Currently active"
          icon={ActivityIcon}
        />
        <StatCard
          label="Roles"
          value="—"
          change="Permission groups"
          icon={ShieldCheckIcon}
        />
        <StatCard
          label="Status"
          value="Live"
          change="All services operational"
          icon={ServerIcon}
        />
      </div>

      {/* Lower section */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Activity feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">System Activity</CardTitle>
                <CardDescription className="text-xs mt-0.5">Real-time application events</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {[
                { label: "Audit logging is active", sub: "All user actions are being recorded", icon: ActivityIcon, dot: "bg-green-500" },
                { label: "Session tracking enabled", sub: "Authentication sessions monitored", icon: ShieldCheckIcon, dot: "bg-primary" },
                { label: "API server is running", sub: "All endpoints responding normally", icon: ServerIcon, dot: "bg-green-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
                  <div className="mt-1.5 size-2 rounded-full shrink-0">
                    <span className={`size-2 rounded-full block ${item.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick access */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Quick Access</CardTitle>
            <CardDescription className="text-xs">Jump to key areas</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {[
              { label: "User Management", sub: "Invite, edit, assign roles", href: "/users", icon: UsersRoundIcon },
              { label: "Audit Logs", sub: "Review all system events", href: "/logs", icon: ActivityIcon },
              { label: "App Settings", sub: "Runtime configuration", href: "/settings", icon: ServerIcon },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors group"
              >
                <div className="size-8 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0">
                  <item.icon className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                </div>
                <ArrowRightIcon className="size-3.5 text-muted-foreground/40 shrink-0 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all" />
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  MailIcon,
  SmartphoneIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { fetchPaginatedInvitations } from "@/api/invitations/invitations.api";
import { invitationsKeys } from "@/api/invitations/invitations.keys";
import { QUERY_STALE_TIMES } from "@/api/query-config";
import { mySessionsQueryOptions } from "@/api/sessions/sessions.queries";
import { fetchPaginatedUsers } from "@/api/users/users.api";
import { usersKeys } from "@/api/users/users.keys";
import { useAuth } from "~react/hooks/use-auth";

export const Route = createFileRoute("/_dashboard/")({
  component: Dashboard,
});

// -- Fake sparkline SVG for dev --
const SPARKLINE_POINTS = [4, 7, 5, 9, 6, 11, 8, 13, 10, 15, 12, 18, 14, 16, 20, 17, 22, 19, 24, 21];
const SPARKLINE_DOWN = [18, 16, 17, 14, 15, 12, 13, 10, 11, 9, 10, 7, 8, 6, 7, 5, 6, 4, 5, 3];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const h = 32;
  const w = 80;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <defs>
        <linearGradient id={`grad-${color.replace(/[^a-z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill={`url(#grad-${color.replace(/[^a-z0-9]/g, "")})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// -- Fake bar chart for dev --
const BAR_DATA = [
  { label: "Mon", value: 64 },
  { label: "Tue", value: 82 },
  { label: "Wed", value: 45 },
  { label: "Thu", value: 93 },
  { label: "Fri", value: 71 },
  { label: "Sat", value: 38 },
  { label: "Sun", value: 56 },
];

function StatSkeleton() {
  return (
    <span className="inline-block w-10 h-8 rounded-lg animate-pulse bg-panel-subtle/8" />
  );
}

function Dashboard() {
  const { t } = useTranslation("web");
  const { user } = useAuth();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12)
      return "Good morning";
    if (hour < 18)
      return "Good afternoon";
    return "Good evening";
  })();

  const firstName = user.name.split(" ")[0];

  const usersQuery = useQuery({
    queryKey: [...usersKeys.paginated, { page: 1, limit: 1, sortOrder: "desc" as const }],
    queryFn: () => fetchPaginatedUsers({ page: 1, limit: 1, sortOrder: "desc" }),
    staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
  });

  const invitationsQuery = useQuery({
    queryKey: [...invitationsKeys.paginated, { page: 1, limit: 1, sortOrder: "desc" as const }],
    queryFn: () => fetchPaginatedInvitations({ page: 1, limit: 1, sortOrder: "desc" }),
    staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
  });

  const sessionsQuery = useQuery(mySessionsQueryOptions);

  const totalUsers = usersQuery.data?.pagination?.total;
  const totalInvitations = invitationsQuery.data?.pagination?.total;
  const sessions = sessionsQuery.data?.sessions;
  const totalSessions = sessions?.length;

  const barMax = Math.max(...BAR_DATA.map(d => d.value));

  return (
    <div className="flex flex-1 flex-col pt-6 md:pt-8">

      {/* Hero panel with integrated stats */}
      <div className="relative overflow-hidden rounded-2xl mx-6 md:mx-8 bg-panel">
        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none hero-grid" />
        {/* Primary orb — bottom right */}
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-[80px] pointer-events-none bg-primary opacity-[0.22]" />
        {/* Secondary orb — top left */}
        <div className="absolute -top-20 -left-20 w-56 h-56 rounded-full blur-[60px] pointer-events-none bg-primary opacity-[0.08]" />

        {/* Top section: greeting + CTA */}
        <div className="relative z-10 p-8 md:p-10 pb-0 md:pb-0">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary">
                <span className="size-1.5 rounded-full bg-current" />
                {t("pages.home.title")}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.05] tracking-tighter text-panel-heading">
                {greeting}
                ,
                <br />
                {firstName}
                .
              </h1>
              <p className="text-sm max-w-sm leading-relaxed text-panel-meta">
                Here's an overview of your application. All systems are running normally.
              </p>
            </div>

            <Link
              to="/users"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 shrink-0 self-start md:self-auto bg-primary text-primary-foreground"
            >
              Manage Users
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>

        {/* Stats row — integrated into hero */}
        <div className="relative z-10 grid grid-cols-3 mt-8 border-t border-panel-subtle/8">
          {([
            { icon: UsersIcon, label: "Total Users", value: totalUsers, isLoading: usersQuery.isLoading, to: "/users" as const },
            { icon: MailIcon, label: "Invitations", value: totalInvitations, isLoading: invitationsQuery.isLoading, to: "/users" as const },
            { icon: SmartphoneIcon, label: "Your Sessions", value: totalSessions, isLoading: sessionsQuery.isLoading, to: "/account" as const },
          ] as const).map((stat, i) => (
            <Link
              key={stat.label}
              to={stat.to}
              className={`group flex items-center gap-4 px-8 md:px-10 py-6 transition-colors hover:bg-panel-subtle/3 ${i < 2 ? "border-r border-panel-subtle/8" : ""}`}
            >
              <div className="size-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/15">
                <stat.icon className="size-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-panel-meta">
                  {stat.label}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold tracking-tight text-panel-heading">
                    {stat.isLoading ? <StatSkeleton /> : (stat.value ?? "—")}
                  </span>
                </div>
              </div>
              <ArrowUpRightIcon className="size-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
            </Link>
          ))}
        </div>
      </div>

      {/* Content grid — fake indicators for dev */}
      <div className="grid grid-cols-6 grid-rows-[auto_1fr] h-full w-full">

        {/* Row 1: Fake metric cards with sparklines */}
        <div className="p-6 md:p-8 border-r border-b col-span-2 group">
          <div className="flex items-start justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Signups</span>
            <span className="text-[11px] font-semibold flex items-center gap-1 text-primary">
              <TrendingUpIcon className="size-3" />
              +12.5%
            </span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">248</span>
            <Sparkline data={SPARKLINE_POINTS} color="var(--color-primary)" />
          </div>
          <span className="text-xs text-muted-foreground/50 mt-2 block">vs. 220 last month</span>
        </div>

        <div className="p-6 md:p-8 border-r border-b col-span-2 group">
          <div className="flex items-start justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Page Views</span>
            <span className="text-[11px] font-semibold flex items-center gap-1 text-primary">
              <TrendingUpIcon className="size-3" />
              +8.3%
            </span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">12.4k</span>
            <Sparkline data={SPARKLINE_POINTS.map(v => v * 3 + 10)} color="var(--color-primary)" />
          </div>
          <span className="text-xs text-muted-foreground/50 mt-2 block">vs. 11.5k last month</span>
        </div>

        <div className="p-6 md:p-8 border-b col-span-2 group">
          <div className="flex items-start justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bounce Rate</span>
            <span className="text-[11px] font-semibold flex items-center gap-1 rotate-180 text-panel-destructive">
              <TrendingUpIcon className="size-3" />
            </span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">24.8%</span>
            <Sparkline data={SPARKLINE_DOWN} color="var(--color-panel-meta)" />
          </div>
          <span className="text-xs text-muted-foreground/50 mt-2 block">vs. 28.1% last month</span>
        </div>

        {/* Row 2 left: Bar chart */}
        <div className="p-6 md:p-8 col-span-4 border-r">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly Activity</span>
            <span className="text-xs text-muted-foreground/50">Last 7 days</span>
          </div>

          <div className="flex items-end gap-3 h-40">
            {BAR_DATA.map(bar => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-32">
                  <div
                    className="w-full rounded-md transition-all bar-gradient"
                    style={{ height: `${(bar.value / barMax) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground/50">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 right: Breakdown */}
        <div className="p-6 md:p-8 col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-6">
            Traffic Sources
          </span>

          <div className="space-y-4">
            {[
              { label: "Direct", value: 42, className: "bg-primary" },
              { label: "Organic", value: 28, className: "bg-chart-3" },
              { label: "Referral", value: 18, className: "bg-panel-meta" },
              { label: "Social", value: 12, className: "bg-panel-subtle/30" },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {item.value}
                    %
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${item.className}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Role badges */}
          <div className="pt-5 border-t mt-8">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
              Your Roles
            </div>
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map(role => (
                <span
                  key={role.id}
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                    role.name === "admin"
                      ? "bg-primary/15 text-primary"
                      : "bg-panel-subtle/8 text-panel-meta"
                  }`}
                >
                  {t(`pages.roles.names.${role.name}`, role.name)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

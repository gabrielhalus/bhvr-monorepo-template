import type { User as _User } from "~shared/types/db/users.types";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { userQueryOptions } from "@/api/users/users.queries";
import { FormLayout, FormSide, FormStack, SideCard, SideStats } from "@/components/detail-kit";
import { useUserApiKeys } from "@/hooks/api-keys/use-user-api-keys";
import { useUserSessions } from "@/hooks/sessions/use-user-sessions";
import { useUser } from "@/hooks/users/use-user";
import i18n from "@/i18n";
import { formatFullName } from "@/lib/name-utils";
import { Avatar } from "~orbit/components/ui/Avatar";
import { Badge } from "~orbit/components/ui/Badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "~orbit/components/ui/Breadcrumb";
import { Calendar, Info, Mail } from "~orbit/components/ui/icons";
import { formatValue } from "~shared/i18n";

import { UserApiKeysCard } from "./-components/user-api-keys-card";
import { UserInformationsForm } from "./-components/user-informations-form";
import { UserRolesForm } from "./-components/user-roles-form";
import { UserDangerZone, UserSecurityActions } from "./-components/user-security-actions";
import { UserSessionsCard } from "./-components/user-sessions-card";

export const Route = createFileRoute("/_dashboard/users/$userId/")({
  component: User,
  loader: ({ params, context }) => context.queryClient.ensureQueryData(userQueryOptions(params.userId)),
  staticData: { crumb: (data: { user?: _User }) => data.user ? formatFullName(data.user.firstName, data.user.lastName) : undefined },
});

function User() {
  const { t } = useTranslation("web");

  const { userId } = Route.useParams();
  const userQuery = useUser(userId);
  const user = userQuery.data?.user;
  const fullName = user ? formatFullName(user.firstName, user.lastName) : "—";
  const verified = Boolean(user?.verifiedAt);

  const sessionsQuery = useUserSessions(userId);
  const apiKeysQuery = useUserApiKeys(userId);
  const sessionsCount = sessionsQuery.data?.sessions?.length;
  const apiKeysCount = apiKeysQuery.data?.apiKeys?.length;

  return (
    <div className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-4 px-4 py-6 md:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/">{t("home.title")}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/users">{t("users.title")}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{fullName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Identity head */}
      <header className="grid grid-cols-1 items-start gap-5 border-b border-line pb-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-center gap-4">
          {user && <Avatar size="lg" name={fullName} src={user.avatar ?? undefined} />}
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{fullName}</h1>
              {user && (
                <Badge tone={verified ? "sage" : "neutral"} dot>
                  {verified ? t("account.emailVerified") : t("account.emailUnverified")}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5 text-faint" />
                {user?.email ?? "—"}
              </span>
              {user?.createdAt && (
                <>
                  <span className="text-faint">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-faint" />
                    {t("users.detail.joinedAt", { date: new Date(user.createdAt) })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
          <UserSecurityActions userId={userId} />
        </div>
      </header>

      <FormLayout className="lg:grid-cols-[1fr_360px]">
        <FormStack>
          <UserInformationsForm userId={userId} />
          <UserRolesForm userId={userId} />
          <UserSessionsCard userId={userId} userName={fullName} />
          <UserApiKeysCard userId={userId} />
        </FormStack>

        <FormSide>
          <SideCard icon={<Info />} title={t("users.detail.summary.title")}>
            <SideStats
              rows={[
                { k: t("account.summary.id"), v: <span title={user?.id}>{user?.id ?? "—"}</span>, mono: true },
                { k: t("account.summary.status"), v: verified ? t("account.emailVerified") : t("account.emailUnverified"), tone: verified ? "green" : undefined },
                { k: t("account.summary.memberSince"), v: user?.createdAt ? formatValue(new Date(user.createdAt), { locale: i18n.language, format: "date" }) : "—" },
                ...(sessionsCount !== undefined ? [{ k: t("account.summary.activeSessions"), v: sessionsCount }] : []),
                ...(apiKeysCount !== undefined ? [{ k: t("users.detail.summary.apiKeys"), v: apiKeysCount }] : []),
              ]}
            />
          </SideCard>

          <UserDangerZone userId={userId} />
        </FormSide>
      </FormLayout>
    </div>
  );
}

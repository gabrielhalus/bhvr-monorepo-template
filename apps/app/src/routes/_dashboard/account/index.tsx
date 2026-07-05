import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { FormLayout, FormSide, FormStack, SideCard, SideStats } from "@/components/detail-kit";
import { useMySessions } from "@/hooks/sessions/use-my-sessions";
import { useAuth } from "@/hooks/use-auth";
import i18n from "@/i18n";
import { api } from "@/lib/http";
import { formatFullName } from "@/lib/name-utils";
import sayno from "@/lib/sayno";
import { Badge } from "~orbit/components/ui/Badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "~orbit/components/ui/Breadcrumb";
import { Button } from "~orbit/components/ui/Button";
import { Calendar, Check, Info, LogOut, Mail, Plus, Shield } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";
import { formatValue } from "~shared/i18n";

import { AvatarUploader } from "./-components/avatar-uploader";
import { LinkedAccountsCard } from "./-components/linked-accounts-card";
import { PasswordForm } from "./-components/password-form";
import { SessionsCard } from "./-components/sessions-card";
import { UserInformationsForm } from "./-components/user-informations-form";

const searchSchema = z.object({
  linked: z.string().optional(),
  oauthError: z.string().optional(),
});

export const Route = createFileRoute("/_dashboard/account/")({
  validateSearch: searchSchema,
  component: Account,
  staticData: { crumb: "account.title" },
});

function Account() {
  const { t } = useTranslation("web");
  const { t: tAuth } = useTranslation("auth");
  const navigate = useNavigate();

  const { user } = useAuth();
  const fullName = formatFullName(user.firstName, user.lastName);
  const verified = Boolean(user.verifiedAt);

  // Feedback from a settings-initiated OAuth link roundtrip, then strip params.
  const { linked, oauthError } = Route.useSearch();
  useEffect(() => {
    if (!linked && !oauthError) return;

    if (linked) {
      toast.success(t("account.linkedAccounts.linkSuccess"));
    } else if (oauthError) {
      toast.error(t(`account.linkedAccounts.errors.${oauthError === "account_taken" || oauthError === "provider_already_linked" ? oauthError : "oauth_failed"}` as never));
    }

    navigate({ to: "/account", search: {}, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linked, oauthError]);

  const sessionsQuery = useMySessions();
  const sessionsCount = sessionsQuery.data?.sessions?.length ?? 0;

  const logout = useMutation({
    mutationFn: async () => {
      const confirmed = await sayno.confirm({ description: tAuth("logout.dialog") });
      if (!confirmed) return false;
      const res = await api.auth.logout.$post();
      if (!res.ok) throw new Error("Failed to logout");
      return true;
    },
    onSuccess: (loggedOut) => {
      if (loggedOut) navigate({ to: "/login", replace: true });
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-4 px-4 py-6 md:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/">{t("home.title")}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("account.title")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Identity head */}
      <header className="grid grid-cols-1 items-start gap-5 border-b border-line pb-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-center gap-4">
          <AvatarUploader name={fullName} />
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{fullName}</h1>
              <Badge tone={verified ? "sage" : "neutral"} dot>
                {verified ? t("account.emailVerified") : t("account.emailUnverified")}
              </Badge>
              {user.roles?.map(role => (
                <Badge key={role.id} tone={role.isDefault ? "neutral" : "accent"}>
                  {t(`roles.names.${role.name}`, { defaultValue: role.name })}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5 text-faint" />
                {user.email}
              </span>
              <span className="text-faint">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 text-faint" />
                {t("account.joinedAt", { date: new Date(user.createdAt) })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
          <Button variant="outline" size="sm" disabled={logout.isPending} onClick={() => logout.mutate()}>
            <LogOut className="size-3.5" />
            {t("account.actions.logout")}
          </Button>
        </div>
      </header>

      <FormLayout className="lg:grid-cols-[1fr_360px]">
        <FormStack>
          <UserInformationsForm userId={user.id} />
          <PasswordForm userId={user.id} />
          <LinkedAccountsCard />
          <SessionsCard />
        </FormStack>

        <FormSide>
          <SideCard icon={<Info />} title={t("account.summary.title")}>
            <SideStats
              rows={[
                { k: t("account.summary.id"), v: <span title={user.id}>{user.id}</span>, mono: true },
                { k: t("account.summary.status"), v: verified ? t("account.emailVerified") : t("account.emailUnverified"), tone: verified ? "green" : undefined },
                { k: t("account.summary.memberSince"), v: formatValue(new Date(user.createdAt), { locale: i18n.language, format: "date" }) },
                { k: t("account.summary.activeSessions"), v: sessionsCount },
              ]}
            />
          </SideCard>

          <SideCard icon={<Shield />} title={t("account.security.title")}>
            <ul className="flex flex-col">
              <SecurityTip
                ok={verified}
                title={verified ? t("account.security.emailVerified") : t("account.security.emailUnverified")}
                desc={verified ? t("account.security.emailVerifiedDesc") : t("account.security.emailUnverifiedDesc")}
              />
              <SecurityTip ok title={t("account.security.password")} desc={t("account.security.passwordDesc")} />
              <SecurityTip title={t("account.security.twoFactor")} desc={t("account.security.twoFactorDesc")} />
            </ul>
          </SideCard>
        </FormSide>
      </FormLayout>
    </div>
  );
}

function SecurityTip({ ok, title, desc }: { ok?: boolean; title: React.ReactNode; desc: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 border-b border-dashed border-line py-2.5 text-[11.5px] leading-snug text-muted last:border-none last:pb-0">
      <span className={cn("mt-px grid size-5.5 shrink-0 place-items-center rounded-full [&_svg]:size-3", ok ? "bg-sage text-white" : "bg-surface-2 text-muted")}>
        {ok ? <Check strokeWidth={3} /> : <Plus strokeWidth={2.5} />}
      </span>
      <span>
        <strong className="font-semibold text-ink">{title}</strong>
        {" · "}
        {desc}
      </span>
    </li>
  );
}

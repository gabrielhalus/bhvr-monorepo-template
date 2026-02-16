import { createFileRoute } from "@tanstack/react-router";
import { CalendarIcon, MailIcon, ShieldIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AvatarUser } from "@/components/avatar-user";
import { Badge } from "~react/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~react/components/card";
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
    <div className="w-full p-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t("web:pages.account.title")}</h1>
          <p className="text-muted-foreground">{t("web:pages.account.subtitle")}</p>
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-4">
            <AvatarUser avatar={user.avatar} name={user.name} size="lg" />
            <div className="flex-1">
              <CardTitle>{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MailIcon className="size-3" />
                {user.email}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="size-4" />
                <span>
                  {t("web:pages.account.joinedAt", { date: new Date(user.createdAt) })}
                </span>
              </div>
              {user.verifiedAt && (
                <Badge variant="secondary">Verified</Badge>
              )}
            </div>

            {user.roles && user.roles.length > 0 && (
              <div className="flex items-center gap-2">
                <ShieldIcon className="size-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {user.roles.map(role => (
                    <Badge key={role.id} variant={role.isDefault ? "outline" : "secondary"}>
                      {t(`web:pages.roles.names.${role.name}`, { defaultValue: role.name })}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <UserInformationsForm userId={user.id} />
        <PasswordForm userId={user.id} />
        <SessionsCard />
      </div>
    </div>
  );
}

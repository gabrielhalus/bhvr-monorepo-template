import type { User as _User } from "~shared/types/db/users.types";

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CalendarIcon, MailIcon, ShieldIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { userQueryOptions } from "@/api/users/users.queries";
import { AvatarUser } from "@/components/avatar-user";
import { Badge } from "~react/components/badge";
import { Button } from "~react/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~react/components/card";

import { UserInformationsForm } from "./-components/user-informations-form";
import { UserSecurityActions } from "./-components/user-security-actions";

export const Route = createFileRoute("/_dashboard/users/$userId/")({
  component: User,
  loader: ({ params, context }) => context.queryClient.fetchQuery(userQueryOptions(params.userId)),
  staticData: { crumb: (data: { user?: _User }) => data.user?.name },
});

function User() {
  const { t } = useTranslation(["common", "web"]);
  const { user } = Route.useLoaderData();

  return (
    <div className="w-full p-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/users">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t("web:pages.users.detail.title")}</h1>
            <p className="text-muted-foreground">{t("web:pages.users.detail.subtitle")}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-4">
            <AvatarUser avatar={user.avatar ?? ""} name={user.name ?? ""} size="lg" />
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
                  {t("web:pages.users.detail.joinedAt", { date: new Date(user?.createdAt ?? "") })}
                </span>
              </div>
              {user.verifiedAt && <Badge variant="secondary">Verified</Badge>}
            </div>

            {user.roles && user.roles.length > 0 && (
              <div className="flex items-center gap-2">
                <ShieldIcon className="size-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {user.roles.map(role => (
                    <Badge key={role.id} variant={role.isDefault ? "outline" : "secondary"}>
                      {role.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <UserInformationsForm user={user} />
        <UserSecurityActions user={user} />
      </div>
    </div>
  );
}

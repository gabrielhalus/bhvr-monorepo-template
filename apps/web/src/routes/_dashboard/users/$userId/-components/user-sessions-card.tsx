import type { Token } from "~shared/types/db/tokens.types";

import { useQuery } from "@tanstack/react-query";
import { MonitorIcon, SmartphoneIcon, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useRevokeAllUserSessions } from "@/hooks/sessions/use-revoke-all-user-sessions";
import { useRevokeUserSession } from "@/hooks/sessions/use-revoke-user-session";
import { useUserSessions } from "@/hooks/sessions/use-user-sessions";
import { Button } from "~react/components/button";
import { Separator } from "~react/components/separator";
import { Spinner } from "~react/components/spinner";
import sayno from "~react/lib/sayno";
import { authorizeQueryOptions } from "~react/queries/auth";

type UserSessionsCardProps = {
  userId: string;
  userName: string;
};

function getDeviceIcon(userAgent: string | null) {
  if (!userAgent)
    return MonitorIcon;
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone"))
    return SmartphoneIcon;
  return MonitorIcon;
}

function parseDeviceName(userAgent: string | null, fallback: string): string {
  if (!userAgent)
    return fallback;

  if (/iPhone/i.test(userAgent))
    return "iPhone";
  if (/iPad/i.test(userAgent))
    return "iPad";
  if (/Android/i.test(userAgent))
    return "Android";
  if (/Windows/i.test(userAgent))
    return "Windows";
  if (/Macintosh/i.test(userAgent))
    return "Mac";
  if (/Linux/i.test(userAgent))
    return "Linux";

  return fallback;
}

export function UserSessionsCard({ userId, userName }: UserSessionsCardProps) {
  const { t } = useTranslation("web");

  const { data: canRevoke } = useQuery(authorizeQueryOptions("session:revoke"));
  const { data: canList } = useQuery(authorizeQueryOptions("session:list"));

  const sessionsQuery = useUserSessions(userId);
  const revokeSession = useRevokeUserSession(userId);
  const revokeAll = useRevokeAllUserSessions(userId);

  if (!canList) {
    return null;
  }

  const sessions = sessionsQuery.data?.sessions ?? [];

  const handleRevoke = async (tokenId: string) => {
    const confirmed = await sayno.confirm({
      title: t("pages.users.detail.sessions.revoke"),
      description: t("pages.users.detail.sessions.revokeConfirm"),
      variant: "destructive",
    });

    if (confirmed) {
      revokeSession.mutate(tokenId);
    }
  };

  const handleRevokeAll = async () => {
    const confirmed = await sayno.confirm({
      title: t("pages.users.detail.sessions.revokeAll"),
      description: t("pages.users.detail.sessions.revokeAllConfirm", { name: userName }),
      variant: "destructive",
    });

    if (confirmed) {
      revokeAll.mutate();
    }
  };

  return (
    <div>
      <div className="px-6 py-5">
        <h3 className="font-bold leading-none">{t("pages.users.detail.sections.sessions.title")}</h3>
        <p className="text-muted-foreground text-sm mt-1.5">{t("pages.users.detail.sections.sessions.description")}</p>
      </div>
      <div className="px-6 py-5 border-t border-border">
        {sessionsQuery.isLoading && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}

        {!sessionsQuery.isLoading && sessions.length === 0 && (
          <p className="text-muted-foreground text-sm">{t("pages.users.detail.sessions.noSessions")}</p>
        )}

        {!sessionsQuery.isLoading && sessions.length > 0 && (
          <div className="space-y-1">
            {sessions.map((session: Token, index: number) => {
              const DeviceIcon = getDeviceIcon(session.userAgent);
              const deviceName = parseDeviceName(session.userAgent, t("pages.users.detail.sessions.unknownDevice"));

              return (
                <div key={session.id}>
                  <div className="flex items-center gap-3 py-3">
                    <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
                      <DeviceIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="truncate text-sm font-medium">{deviceName}</span>
                      <div className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
                        {session.ip && (
                          <span>
                            {t("pages.users.detail.sessions.ip")}
                            :
                            {" "}
                            {session.ip}
                          </span>
                        )}
                        <span>{t("pages.users.detail.sessions.issuedAt", { date: new Date(session.issuedAt) })}</span>
                      </div>
                    </div>
                    {canRevoke && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={revokeSession.isPending}
                        onClick={() => handleRevoke(session.id)}
                        className="shrink-0 text-destructive hover:text-destructive"
                      >
                        {t("pages.users.detail.sessions.revoke")}
                      </Button>
                    )}
                  </div>
                  {index < sessions.length - 1 && <Separator />}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {canRevoke && sessions.length > 0 && (
        <div className="px-6 py-5 border-t border-border">
          <Button
            variant="destructive"
            size="sm"
            disabled={revokeAll.isPending}
            onClick={handleRevokeAll}
          >
            {revokeAll.isPending ? <Spinner /> : <Trash2Icon className="size-4" />}
            {t("pages.users.detail.sessions.revokeAll")}
          </Button>
        </div>
      )}
    </div>
  );
}

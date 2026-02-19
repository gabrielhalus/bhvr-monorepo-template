import { MonitorIcon, SmartphoneIcon, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useMySessions } from "@/hooks/sessions/use-my-sessions";
import { useRevokeAllSessions } from "@/hooks/sessions/use-revoke-all-sessions";
import { useRevokeSession } from "@/hooks/sessions/use-revoke-session";
import { Badge } from "~react/components/badge";
import { Button } from "~react/components/button";
import { Separator } from "~react/components/separator";
import { Spinner } from "~react/components/spinner";
import sayno from "~react/lib/sayno";

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

export function SessionsCard() {
  const { t } = useTranslation("web");

  const sessionsQuery = useMySessions();
  const revokeSession = useRevokeSession();
  const revokeAll = useRevokeAllSessions();

  const sessions = sessionsQuery.data?.sessions ?? [];
  const nonCurrentSessions = sessions.filter(s => !s.isCurrent);

  const handleRevoke = async (tokenId: string) => {
    const confirmed = await sayno.confirm({
      title: t("pages.account.sessions.revoke"),
      description: t("pages.account.sessions.revokeConfirm"),
      variant: "destructive",
    });

    if (confirmed) {
      revokeSession.mutate(tokenId);
    }
  };

  const handleRevokeAll = async () => {
    const confirmed = await sayno.confirm({
      title: t("pages.account.sessions.revokeOthers"),
      description: t("pages.account.sessions.revokeOthersConfirm"),
      variant: "destructive",
    });

    if (confirmed) {
      revokeAll.mutate();
    }
  };

  return (
    <div>
      <div className="px-6 py-5 flex flex-row items-start justify-between gap-4">
        <div>
          <h3 className="font-bold leading-none">{t("pages.account.sections.sessions.title")}</h3>
          <p className="text-muted-foreground text-sm mt-1.5">{t("pages.account.sections.sessions.description")}</p>
        </div>
        {nonCurrentSessions.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            disabled={revokeAll.isPending}
            onClick={handleRevokeAll}
          >
            {revokeAll.isPending ? <Spinner /> : <Trash2Icon className="size-4" />}
            {t("pages.account.sessions.revokeOthers")}
          </Button>
        )}
      </div>
      <div className="px-6 py-5 border-t border-border">
        {sessionsQuery.isLoading && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}

        {!sessionsQuery.isLoading && sessions.length === 0 && (
          <p className="text-muted-foreground text-sm">{t("pages.account.sessions.noSessions")}</p>
        )}

        {!sessionsQuery.isLoading && sessions.length > 0 && (
          <div className="space-y-1">
            {sessions.map((session, index) => {
              const DeviceIcon = getDeviceIcon(session.userAgent);
              const deviceName = parseDeviceName(session.userAgent, t("pages.account.sessions.unknownDevice"));

              return (
                <div key={session.id}>
                  <div className="flex items-center gap-3 py-3">
                    <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
                      <DeviceIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{deviceName}</span>
                        {session.isCurrent && (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {t("pages.account.sessions.current")}
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
                        {session.ip && <span>{t("pages.account.sessions.ip")}: {session.ip}</span>}
                        <span>{t("pages.account.sessions.issuedAt", { date: new Date(session.issuedAt) })}</span>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={revokeSession.isPending}
                        onClick={() => handleRevoke(session.id)}
                        className="shrink-0 text-destructive hover:text-destructive"
                      >
                        {t("pages.account.sessions.revoke")}
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
    </div>
  );
}

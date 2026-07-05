import { useTranslation } from "react-i18next";

import { FormSection } from "@/components/form-kit";
import { useMySessions } from "@/hooks/sessions/use-my-sessions";
import { useRevokeAllSessions } from "@/hooks/sessions/use-revoke-all-sessions";
import { useRevokeSession } from "@/hooks/sessions/use-revoke-session";
import sayno from "@/lib/sayno";
import { Badge } from "~orbit/components/ui/Badge";
import { Button } from "~orbit/components/ui/Button";
import { Globe, Loader2, Monitor, Smartphone, Trash2 } from "~orbit/components/ui/icons";

function getDeviceIcon(userAgent: string | null) {
  if (!userAgent) return Monitor;
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) return Smartphone;
  return Monitor;
}

function parseDeviceName(userAgent: string | null, fallback: string): string {
  if (!userAgent) return fallback;

  if (/iPhone/i.test(userAgent)) return "iPhone";
  if (/iPad/i.test(userAgent)) return "iPad";
  if (/Android/i.test(userAgent)) return "Android";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Macintosh/i.test(userAgent)) return "Mac";
  if (/Linux/i.test(userAgent)) return "Linux";

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
      title: t("account.sessions.revoke"),
      description: t("account.sessions.revokeConfirm"),
      variant: "destructive",
    });

    if (confirmed) {
      revokeSession.mutate(tokenId);
    }
  };

  const handleRevokeAll = async () => {
    const confirmed = await sayno.confirm({
      title: t("account.sessions.revokeOthers"),
      description: t("account.sessions.revokeOthersConfirm"),
      variant: "destructive",
    });

    if (confirmed) {
      revokeAll.mutate();
    }
  };

  return (
    <FormSection
      flush
      index={<Globe />}
      title={(
        <>
          {t("account.sections.sessions.title")}
          {sessions.length > 0 && <Badge tone="neutral">{sessions.length}</Badge>}
        </>
      )}
      sub={t("account.sections.sessions.description")}
      actions={nonCurrentSessions.length > 0 && (
        <Button variant="danger" size="sm" disabled={revokeAll.isPending} onClick={handleRevokeAll}>
          {revokeAll.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          {t("account.sessions.revokeOthers")}
        </Button>
      )}
    >
      {sessionsQuery.isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted" />
        </div>
      )}

      {!sessionsQuery.isLoading && sessions.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-muted">{t("account.sessions.noSessions")}</p>
      )}

      {!sessionsQuery.isLoading && sessions.length > 0 && (
        <div className="divide-y divide-line">
          {sessions.map((session) => {
            const DeviceIcon = getDeviceIcon(session.userAgent);
            const deviceName = parseDeviceName(session.userAgent, t("account.sessions.unknownDevice"));

            return (
              <div key={session.id} className="flex items-center gap-3.5 px-5 py-3.5">
                <div className="grid size-9.5 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-muted">
                  <DeviceIcon className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-ink">
                    {deviceName}
                    {session.isCurrent && <Badge tone="sage" dot>{t("account.sessions.current")}</Badge>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3.5 text-[11px] text-muted">
                    {session.ip && (
                      <span className="font-mono">
                        {t("account.sessions.ip")}
                        {": "}
                        {session.ip}
                      </span>
                    )}
                    <span>{t("account.sessions.issuedAt", { date: new Date(session.issuedAt) })}</span>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button variant="danger" size="sm" disabled={revokeSession.isPending} onClick={() => handleRevoke(session.id)}>
                    {t("account.sessions.revoke")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </FormSection>
  );
}

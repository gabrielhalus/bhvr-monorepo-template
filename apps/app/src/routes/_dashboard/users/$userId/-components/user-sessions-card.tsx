import type { Token } from "~shared/types/db/tokens.types";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { FormSection } from "@/components/form-kit";
import { useRevokeAllUserSessions } from "@/hooks/sessions/use-revoke-all-user-sessions";
import { useRevokeUserSession } from "@/hooks/sessions/use-revoke-user-session";
import { useUserSessions } from "@/hooks/sessions/use-user-sessions";
import sayno from "@/lib/sayno";
import { authorizeBatchQueryOptions } from "@/queries/auth";
import { Badge } from "~orbit/components/ui/Badge";
import { Button } from "~orbit/components/ui/Button";
import { Globe, Loader2, Monitor, Smartphone, Trash2 } from "~orbit/components/ui/icons";

type UserSessionsCardProps = {
  userId: string;
  userName: string;
};

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

export function UserSessionsCard({ userId, userName }: UserSessionsCardProps) {
  const { t } = useTranslation("web");

  const { data: sessionAuth } = useQuery(
    authorizeBatchQueryOptions([
      { permission: "session:revoke" },
      { permission: "session:list" },
    ]),
  );
  const canRevoke = sessionAuth?.[0] ?? false;
  const canList = sessionAuth?.[1] ?? false;

  const sessionsQuery = useUserSessions(userId);
  const revokeSession = useRevokeUserSession(userId);
  const revokeAll = useRevokeAllUserSessions(userId);

  if (!canList) {
    return null;
  }

  const sessions = sessionsQuery.data?.sessions ?? [];

  const handleRevoke = async (tokenId: string) => {
    if (await sayno.confirm({ description: t("users.detail.sessions.revokeConfirm"), variant: "destructive" })) {
      revokeSession.mutate(tokenId);
    }
  };

  const handleRevokeAll = async () => {
    if (await sayno.confirm({ description: t("users.detail.sessions.revokeAllConfirm", { name: userName }), variant: "destructive" })) {
      revokeAll.mutate();
    }
  };

  return (
    <FormSection
      flush
      index={<Globe />}
      title={(
        <>
          {t("users.detail.sections.sessions.title")}
          {sessions.length > 0 && <Badge tone="neutral">{sessions.length}</Badge>}
        </>
      )}
      sub={t("users.detail.sections.sessions.description")}
      actions={canRevoke && sessions.length > 0 && (
        <Button variant="danger" size="sm" disabled={revokeAll.isPending} onClick={handleRevokeAll}>
          {revokeAll.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          {t("users.detail.sessions.revokeAll")}
        </Button>
      )}
    >
      {sessionsQuery.isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted" />
        </div>
      )}

      {!sessionsQuery.isLoading && sessions.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-muted">{t("users.detail.sessions.noSessions")}</p>
      )}

      {!sessionsQuery.isLoading && sessions.length > 0 && (
        <div className="divide-y divide-line">
          {sessions.map((session: Token) => {
            const DeviceIcon = getDeviceIcon(session.userAgent);
            const deviceName = parseDeviceName(session.userAgent, t("users.detail.sessions.unknownDevice"));

            return (
              <div key={session.id} className="flex items-center gap-3.5 px-5 py-3.5">
                <div className="grid size-9.5 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-muted">
                  <DeviceIcon className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[13px] font-semibold tracking-tight text-ink">{deviceName}</span>
                  <div className="mt-0.5 flex flex-wrap gap-x-3.5 text-[11px] text-muted">
                    {session.ip && (
                      <span className="font-mono">
                        {t("users.detail.sessions.ip")}
                        {": "}
                        {session.ip}
                      </span>
                    )}
                    <span>{t("users.detail.sessions.issuedAt", { date: new Date(session.issuedAt) })}</span>
                  </div>
                </div>
                {canRevoke && (
                  <Button variant="danger" size="sm" disabled={revokeSession.isPending} onClick={() => handleRevoke(session.id)}>
                    {t("users.detail.sessions.revoke")}
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

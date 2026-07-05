import { useTranslation } from "react-i18next";

import { useAuth } from "@/hooks/use-auth";
import { useStopImpersonation } from "@/hooks/users/use-stop-impersonation";
import { formatFullName } from "@/lib/name-utils";
import { Button } from "~orbit/components/ui/Button";
import { Loader2, X } from "~orbit/components/ui/icons";

export function ImpersonationBanner() {
  const { t } = useTranslation("web");
  const { impersonator, user } = useAuth();

  const stopImpersonationMutation = useStopImpersonation();

  if (!impersonator) {
    return null;
  }

  const impersonatorName = formatFullName(impersonator.firstName, impersonator.lastName);
  const userName = formatFullName(user.firstName, user.lastName);

  return (
    <div className="flex items-center justify-center gap-2 bg-accent px-4 py-2 text-center text-sm font-medium text-white">
      <span>{t("impersonation.banner", { impersonator: impersonatorName, user: userName })}</span>
      <Button
        size="sm"
        variant="outline"
        className="h-6 gap-1 border-white/30 bg-white/10 px-2 text-xs text-white hover:bg-white/20"
        onClick={() => stopImpersonationMutation.mutate()}
        disabled={stopImpersonationMutation.isPending}
      >
        {stopImpersonationMutation.isPending
          ? <Loader2 className="size-3 animate-spin" />
          : <X className="size-3" />}
        {t("impersonation.stop")}
      </Button>
    </div>
  );
}

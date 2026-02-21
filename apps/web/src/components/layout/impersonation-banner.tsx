import { XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useStopImpersonation } from "@/hooks/users/use-stop-impersonation";
import { Button } from "~react/components/button";
import { Spinner } from "~react/components/spinner";
import { parseUserName } from "~react/lib/name-utils";
import { useAuth } from "~react/hooks/use-auth";

export function ImpersonationBanner() {
  const { t } = useTranslation("web");
  const { impersonator, user } = useAuth();

  const stopImpersonationMutation = useStopImpersonation();

  if (!impersonator) {
    return null;
  }

  const impersonatorName = parseUserName(impersonator.name).fullName;
  const userName = parseUserName(user.name).fullName;

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2">
        <span>
          {t("impersonation.banner", { impersonator: impersonatorName, user: userName })}
        </span>
        <Button
          size="sm"
          variant="secondary"
          className="h-6 px-2 text-xs"
          onClick={() => stopImpersonationMutation.mutate()}
          disabled={stopImpersonationMutation.isPending}
        >
          {stopImpersonationMutation.isPending
            ? (
                <Spinner className="size-3" />
              )
            : (
                <XIcon className="size-3" />
              )}
          {t("impersonation.stop")}
        </Button>
      </div>
    </div>
  );
}

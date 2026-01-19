import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "~react/components/button";
import { Spinner } from "~react/components/spinner";
import { useAuth } from "~react/hooks/use-auth";
import { api } from "~react/lib/http";

export function ImpersonationBanner() {
  const { t } = useTranslation("web");
  const { impersonator, user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const stopImpersonationMutation = useMutation({
    mutationFn: async () => {
      const res = await api.auth["stop-impersonation"].$post();

      if (!res.ok) {
        throw new Error("Failed to stop impersonation");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success(t("impersonation.stopped"));
      queryClient.invalidateQueries();
      navigate({ to: "/" });
    },
    onError: () => {
      toast.error(t("impersonation.stopError"));
    },
  });

  if (!impersonator) {
    return null;
  }

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2">
        <span>
          {t("impersonation.banner", { impersonator: impersonator.name, user: user.name })}
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

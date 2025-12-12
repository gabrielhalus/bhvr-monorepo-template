import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@bunstack/react/components/button";
import { DropdownMenuItem } from "@bunstack/react/components/dropdown-menu";
import { Spinner } from "@bunstack/react/components/spinner";
import { useAuth } from "@bunstack/react/hooks/use-auth";
import { api } from "@bunstack/react/lib/http";
import sayno from "@bunstack/react/lib/sayno";

type Variant = "button" | "dropdown";

type CommonProps = {
  variant?: Variant;
  className?: string;
};

export function LogoutButton({ variant = "button", className }: CommonProps) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();

  const mutation = useMutation({
    mutationFn: async () => {
      const confirmation = await sayno({ description: t("logout.dialog") });
      if (!confirmation) {
        return false;
      }

      const res = await api.auth.logout.$post();

      if (!res.ok) {
        throw new Error("Failed to logout");
      }

      return true;
    },
    onSuccess: (loggedOut) => {
      if (!loggedOut) {
        return;
      }

      // Redirect to login
      navigate({ href: `/?redirect=${encodeURIComponent(location.href)}`, replace: true });
    },
    onError: () => {
      toast.error(t("logout.error"));
    },
  });

  const handleLogoutClick = () => mutation.mutate();

  const content = (
    <>
      {mutation.isPending ? <Spinner /> : <LogOut />}
      {t("logout.label")}
    </>
  );

  if (!isAuthenticated) {
    return null;
  }

  if (variant === "dropdown") {
    return (
      <DropdownMenuItem onClick={handleLogoutClick} className={className}>
        {content}
      </DropdownMenuItem>
    );
  }

  return (
    <Button disabled={mutation.isPending} onClick={handleLogoutClick} className={className}>
      {content}
    </Button>
  );
}

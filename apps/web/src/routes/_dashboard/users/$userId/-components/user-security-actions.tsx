import type { User } from "~shared/types/db/users.types";

import { useQuery } from "@tanstack/react-query";
import { CheckIcon, CopyIcon, KeyIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useImpersonateUser } from "@/hooks/users/use-impersonate-user";
import { useResetUserPassword } from "@/hooks/users/use-reset-user-password";
import { Button } from "~react/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~react/components/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~react/components/dialog";
import { Input } from "~react/components/input";
import { Spinner } from "~react/components/spinner";
import { useAuth } from "~react/hooks/use-auth";
import sayno from "~react/lib/sayno";
import { authorizeQueryOptions } from "~react/queries/auth";

export function UserSecurityActions({ user }: { user: User }) {
  const { t } = useTranslation();

  const { user: currentUser } = useAuth();

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: canImpersonate } = useQuery(authorizeQueryOptions("user:impersonate", { id: user.id }));
  const isSelf = currentUser.id === user.id;

  const resetPasswordMutation = useResetUserPassword();
  const impersonateMutation = useImpersonateUser(user.name);

  const handleResetPassword = async () => {
    const confirmation = await sayno.confirm({
      title: t("web:pages.users.detail.resetPassword.confirmTitle"),
      description: t("web:pages.users.detail.resetPassword.confirmDescription"),
      variant: "destructive",
    });

    if (confirmation) {
      const response = await resetPasswordMutation.mutateAsync(user.id);
      setGeneratedPassword(response.password);
      setPasswordDialogOpen(true);
      setCopied(false);
    }
  };

  const handleCopyPassword = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success(t("web:pages.users.detail.resetPassword.copied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImpersonate = async () => {
    const confirmation = await sayno.confirm({
      title: t("web:pages.users.detail.impersonate.confirmTitle"),
      description: t("web:pages.users.detail.impersonate.confirmDescription", { name: user.name }),
    });

    if (confirmation) {
      impersonateMutation.mutate(user.id);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("web:pages.users.detail.sections.security.title")}</CardTitle>
          <CardDescription>{t("web:pages.users.detail.sections.security.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleResetPassword}
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending
              ? <Spinner className="mr-2" />
              : <KeyIcon className="mr-2 size-4" />}
            {t("web:pages.users.detail.resetPassword.button")}
          </Button>

          {canImpersonate && !isSelf && (
            <Button
              variant="outline"
              onClick={handleImpersonate}
              disabled={impersonateMutation.isPending}
            >
              {impersonateMutation.isPending ? <Spinner className="mr-2" /> : <UserIcon className="mr-2 size-4" />}
              {t("web:pages.users.detail.impersonate.button")}
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("web:pages.users.detail.resetPassword.successTitle")}</DialogTitle>
            <DialogDescription>
              {t("web:pages.users.detail.resetPassword.successDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={generatedPassword || ""}
              className="font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyPassword}
            >
              {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setPasswordDialogOpen(false)}>
              {t("common:form.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { SideCard } from "@/components/detail-kit";
import { useAuth } from "@/hooks/use-auth";
import { useDeleteUser } from "@/hooks/users/use-delete-user";
import { useImpersonateUser } from "@/hooks/users/use-impersonate-user";
import { useResetUserPassword } from "@/hooks/users/use-reset-user-password";
import { useUser } from "@/hooks/users/use-user";
import { formatFullName } from "@/lib/name-utils";
import sayno from "@/lib/sayno";
import { authorizeBatchQueryOptions } from "@/queries/auth";
import { Button } from "~orbit/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~orbit/components/ui/Dialog";
import { Check, Copy, KeyRound, Loader2, Trash2, TriangleAlert, User } from "~orbit/components/ui/icons";
import { Input } from "~orbit/components/ui/Input";

/** Head actions: reset password + impersonate (with the generated-password dialog). */
export function UserSecurityActions({ userId }: { userId: string }) {
  const { t } = useTranslation("web");

  const { user: currentUser } = useAuth();
  const userQuery = useUser(userId);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: securityAuth } = useQuery(
    authorizeBatchQueryOptions([{ permission: "user:impersonate", resource: { id: userId } }]),
  );
  const canImpersonate = securityAuth?.[0] ?? false;
  const isSelf = currentUser.id === userId;

  const resetPasswordMutation = useResetUserPassword();
  const user = userQuery.data?.user;
  const userName = user ? formatFullName(user.firstName, user.lastName) : "";
  const impersonateMutation = useImpersonateUser(userName);

  const handleResetPassword = async () => {
    const confirmation = await sayno.confirm({
      title: t("users.detail.resetPassword.confirmTitle"),
      description: t("users.detail.resetPassword.confirmDescription"),
      variant: "destructive",
    });

    if (confirmation) {
      const response = await resetPasswordMutation.mutateAsync(userId);
      setGeneratedPassword(response.password);
      setPasswordDialogOpen(true);
      setCopied(false);
    }
  };

  const handleCopyPassword = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success(t("users.detail.resetPassword.copied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImpersonate = async () => {
    const confirmation = await sayno.confirm({
      title: t("users.detail.impersonate.confirmTitle"),
      description: t("users.detail.impersonate.confirmDescription", { name: userName }),
    });

    if (confirmation) {
      impersonateMutation.mutate(userId);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleResetPassword} disabled={resetPasswordMutation.isPending}>
        {resetPasswordMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />}
        {t("users.detail.resetPassword.button")}
      </Button>

      {canImpersonate && !isSelf && (
        <Button size="sm" onClick={handleImpersonate} disabled={impersonateMutation.isPending}>
          {impersonateMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <User className="size-3.5" />}
          {t("users.detail.impersonate.button")}
        </Button>
      )}

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.detail.resetPassword.successTitle")}</DialogTitle>
            <DialogDescription>
              {t("users.detail.resetPassword.successDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={generatedPassword ?? ""} className="font-mono" />
            <Button variant="outline" size="icon" onClick={handleCopyPassword} className="shrink-0">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setPasswordDialogOpen(false)}>
              {t("actions.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Sidebar danger zone: irreversible deletion of the user. */
export function UserDangerZone({ userId }: { userId: string }) {
  const { t } = useTranslation("web");
  const navigate = useNavigate();

  const { user: currentUser } = useAuth();
  const deleteMutation = useDeleteUser();

  const { data: deleteAuth } = useQuery(
    authorizeBatchQueryOptions([{ permission: "user:delete", resource: { id: userId } }]),
  );
  const canDelete = deleteAuth?.[0] ?? false;
  const isSelf = currentUser.id === userId;

  if (!canDelete || isSelf) {
    return null;
  }

  const handleDelete = async () => {
    const confirmed = await sayno.confirm({
      title: t("users.actions.deleteUser"),
      description: t("users.actions.deleteUserConfirm"),
      variant: "destructive",
    });

    if (confirmed) {
      await deleteMutation.mutateAsync(userId);
      navigate({ to: "/users", replace: true });
    }
  };

  return (
    <SideCard tone="danger" icon={<TriangleAlert />} title={t("users.detail.danger.title")}>
      <p className="mb-3 text-xs/relaxed text-muted">{t("users.detail.danger.description")}</p>
      <Button variant="danger" size="sm" disabled={deleteMutation.isPending} onClick={handleDelete} className="w-full justify-center">
        {deleteMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        {t("users.detail.danger.delete")}
      </Button>
    </SideCard>
  );
}

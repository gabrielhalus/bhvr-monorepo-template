import type { ApiKey } from "~shared/types/db/api-keys.types";

import { useQuery } from "@tanstack/react-query";
import { CheckIcon, CopyIcon, KeyIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useCreateUserApiKey } from "@/hooks/api-keys/use-create-user-api-key";
import { useDeleteUserApiKey } from "@/hooks/api-keys/use-delete-user-api-key";
import { useUserApiKeys } from "@/hooks/api-keys/use-user-api-keys";
import { Button } from "~react/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~react/components/dialog";
import { Input } from "~react/components/input";
import sayno from "~react/lib/sayno";
import { authorizeBatchQueryOptions } from "~react/queries/auth";

type UserApiKeysCardProps = {
  userId: string;
};

export function UserApiKeysCard({ userId }: UserApiKeysCardProps) {
  const { t } = useTranslation("web");

  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data } = useQuery(
    authorizeBatchQueryOptions([
      { permission: "apiKey:list" },
      { permission: "apiKey:create" },
      { permission: "apiKey:revoke" },
    ]),
  );

  const [canList = false, canCreate = false, canRevoke = false] = data ?? [];

  const createUserApiKey = useCreateUserApiKey(userId);
  const deleteUserApiKey = useDeleteUserApiKey(userId);

  const apiKeysQuery = useUserApiKeys(userId);

  if (!canList) {
    return null;
  }

  const apiKeys = apiKeysQuery.data?.apiKeys ?? [];

  const handleCreate = async () => {
    const response = await createUserApiKey.mutateAsync(userId);
    setGeneratedSecret(response.apiKey);
    setSecretDialogOpen(true);
    setCopied(false);
  };

  const handleCopySecret = async () => {
    if (generatedSecret) {
      await navigator.clipboard.writeText(generatedSecret);
      setCopied(true);
      toast.success(t("web:pages.users.detail.createApiKey.copied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async (apiKeyId: string) => {
    if (await sayno.confirm({ description: t("web:pages.users.detail.deleteApiKey.confirm"), variant: "destructive" })) {
      await deleteUserApiKey.mutateAsync({ userId, apiKeyId });
    }
  };

  return (
    <>
      <div>
        <div className="px-6 py-5">
          <h3 className="font-bold leading-none">{t("web:pages.users.detail.sections.api.title")}</h3>
          <p className="text-muted-foreground text-sm mt-1.5">{t("web:pages.users.detail.sections.api.description")}</p>
        </div>
        <div className="px-6 py-5 border-t border-border">
          {!apiKeysQuery.isLoading && apiKeys.length > 0 && (
            <div className="space-y-1">
              {apiKeys.map((apiKey: ApiKey) => (
                  <div key={apiKey.id} className="flex items-center gap-3 py-3">
                      <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
                        <KeyIcon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <span className="truncate text-xs font-mono font-medium">{`sk_live_${apiKey.prefix}`}</span>
                        <div className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
                          <span>{t("web:pages.users.detail.apiKeys.added", { date: new Date(apiKey.createdAt) })}</span>
                          {apiKey.lastUsedAt && <span>{t("web:pages.users.detail.apiKeys.lastUse", { date: new Date(apiKey.lastUsedAt) })}</span>}
                        </div>
                      </div>
                      {canRevoke && (
                        <Button
                          variant="destructive-ghost"
                          size="sm"
                          disabled={deleteUserApiKey.isPending}
                          onClick={() => handleDelete(apiKey.id)}
                        >
                          {t("web:pages.users.detail.deleteApiKey.button")}
                        </Button>
                      )}
                  </div>
              ))}
            </div>
          )}
        </div>
        { canCreate && (
          <div className="px-6 py-5 border-t border-border">
            <Button size="sm" onClick={handleCreate}>
              <PlusIcon className="size-4" />
              {t("web:pages.users.detail.createApiKey.button")}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={secretDialogOpen} onOpenChange={setSecretDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("web:pages.users.detail.createApiKey.success")}</DialogTitle>
            <DialogDescription>
              {t("web:pages.users.detail.createApiKey.successDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={generatedSecret ?? ""}
              className="font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopySecret}
            >
              {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setSecretDialogOpen(false)}>
              {t("web:pages.users.detail.createApiKey.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

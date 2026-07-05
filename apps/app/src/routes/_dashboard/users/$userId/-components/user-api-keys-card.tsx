import type { ApiKey } from "~shared/types/db/api-keys.types";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { FormSection } from "@/components/form-kit";
import { useCreateUserApiKey } from "@/hooks/api-keys/use-create-user-api-key";
import { useDeleteUserApiKey } from "@/hooks/api-keys/use-delete-user-api-key";
import { useUserApiKeys } from "@/hooks/api-keys/use-user-api-keys";
import sayno from "@/lib/sayno";
import { authorizeBatchQueryOptions } from "@/queries/auth";
import { Badge } from "~orbit/components/ui/Badge";
import { Button } from "~orbit/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~orbit/components/ui/Dialog";
import { Check, Copy, Key, Plus } from "~orbit/components/ui/icons";
import { Input } from "~orbit/components/ui/Input";

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
      toast.success(t("users.detail.createApiKey.copied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async (apiKeyId: string) => {
    if (await sayno.confirm({ description: t("users.detail.deleteApiKey.confirm"), variant: "destructive" })) {
      await deleteUserApiKey.mutateAsync({ userId, apiKeyId });
    }
  };

  return (
    <>
      <FormSection
        flush
        index={<Key />}
        title={(
          <>
            {t("users.detail.sections.api.title")}
            {apiKeys.length > 0 && <Badge tone="neutral">{apiKeys.length}</Badge>}
          </>
        )}
        sub={t("users.detail.sections.api.description")}
        actions={canCreate && (
          <Button size="sm" onClick={handleCreate}>
            <Plus className="size-3.5" />
            {t("users.detail.createApiKey.button")}
          </Button>
        )}
      >
        {!apiKeysQuery.isLoading && apiKeys.length === 0
          ? <p className="px-5 py-10 text-center text-sm text-muted">{t("status.noData")}</p>
          : (
              <div className="divide-y divide-line">
                {apiKeys.map((apiKey: ApiKey) => (
                  <div key={apiKey.id} className="flex items-center gap-3.5 px-5 py-3.5">
                    <div className="grid size-9.5 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-muted">
                      <Key className="size-4.5" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <span className="block truncate font-mono text-[12.5px] font-medium text-ink">{`sk_live_${apiKey.prefix}`}</span>
                      <div className="mt-0.5 flex flex-wrap gap-x-3.5 text-[11px] text-muted">
                        <span>{t("users.detail.apiKeys.added", { date: new Date(apiKey.createdAt) })}</span>
                        {apiKey.lastUsedAt && <span>{t("users.detail.apiKeys.lastUse", { date: new Date(apiKey.lastUsedAt) })}</span>}
                      </div>
                    </div>
                    {canRevoke && (
                      <Button variant="danger" size="sm" disabled={deleteUserApiKey.isPending} onClick={() => handleDelete(apiKey.id)}>
                        {t("users.detail.deleteApiKey.button")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
      </FormSection>

      <Dialog open={secretDialogOpen} onOpenChange={setSecretDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.detail.createApiKey.success")}</DialogTitle>
            <DialogDescription>
              {t("users.detail.createApiKey.successDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={generatedSecret ?? ""} className="font-mono" />
            <Button variant="outline" size="icon" onClick={handleCopySecret} className="shrink-0">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setSecretDialogOpen(false)}>
              {t("users.detail.createApiKey.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

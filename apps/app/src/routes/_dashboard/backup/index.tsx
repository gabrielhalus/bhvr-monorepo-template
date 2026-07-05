import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { backupsQueryOptions, localBackupsQueryOptions } from "@/api/backup/backup.queries";
import { ShellHeader } from "@/components/shell-header";
import { useBackupLocal } from "@/hooks/backup/use-backup-local";
import { useBackupS3 } from "@/hooks/backup/use-backup-s3";
import { useBackups } from "@/hooks/backup/use-backups";
import { useDeleteLocalBackup } from "@/hooks/backup/use-delete-local-backup";
import { useDeleteS3Backup } from "@/hooks/backup/use-delete-s3-backup";
import { useDownloadBackup } from "@/hooks/backup/use-download-backup";
import { useLocalBackups } from "@/hooks/backup/use-local-backups";
import { useRestoreLocal } from "@/hooks/backup/use-restore-local";
import { useRestoreS3 } from "@/hooks/backup/use-restore-s3";
import { Button } from "~orbit/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~orbit/components/ui/Dialog";
import { Cloud, Database, Download, Folder, HardDrive, Loader2, MonitorDown, RefreshCw, Trash2, TriangleAlert, UploadCloud } from "~orbit/components/ui/icons";
import { Panel } from "~orbit/components/ui/Panel";

export const Route = createFileRoute("/_dashboard/backup/")({
  component: BackupPage,
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(backupsQueryOptions),
    context.queryClient.ensureQueryData(localBackupsQueryOptions),
  ]),
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatS3Key(key: string): string {
  return key.replace("backups/db/", "").replace(".dump", "");
}

function PanelHead({ icon, title, sub, action }: { icon: React.ReactNode; title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink [&_svg]:size-4 [&_svg]:text-muted">
          {icon}
          {title}
        </h2>
        <p className="mt-0.5 text-[13px] text-muted">{sub}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyRow({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <Icon className="size-7 text-faint" />
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}

function BackupRow({ name, meta, onRestore, onDelete, restoreLabel, restoreDisabled, deleteDisabled }: {
  name: string;
  meta: string;
  onRestore: () => void;
  onDelete: () => void;
  restoreLabel: string;
  restoreDisabled?: boolean;
  deleteDisabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <HardDrive className="size-4 shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm text-ink">{name}</p>
        <p className="text-xs text-muted">{meta}</p>
      </div>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" disabled={restoreDisabled} onClick={onRestore}>
          <RefreshCw className="size-3.5" />
          {restoreLabel}
        </Button>
        <Button variant="danger" size="sm" disabled={deleteDisabled} onClick={onDelete} className="px-2">
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function BackupPage() {
  const { t } = useTranslation("web");

  // S3
  const { data: s3Data, isLoading: s3Loading } = useBackups();
  const triggerS3 = useBackupS3();
  const restoreS3 = useRestoreS3();
  const deleteS3 = useDeleteS3Backup();
  const [restoreS3Key, setRestoreS3Key] = useState<string | null>(null);

  // Local
  const { data: localData, isLoading: localLoading } = useLocalBackups();
  const triggerLocal = useBackupLocal();
  const restoreLocal = useRestoreLocal();
  const deleteLocal = useDeleteLocalBackup();
  const [restoreLocalPath, setRestoreLocalPath] = useState<string | null>(null);

  // Client download
  const download = useDownloadBackup();

  const s3Backups = s3Data?.backups ?? [];
  const isS3Configured = s3Data?.configured ?? false;
  const localBackups = localData?.backups ?? [];

  return (
    <div className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-4 px-4 py-6 md:px-8">
      <ShellHeader eyebrow={t("backup.subtitle")} title={t("backup.title")} />

      {/* S3 Backups */}
      <Panel>
        <PanelHead
          icon={<Cloud />}
          title={t("backup.s3.title")}
          sub={t("backup.s3.subtitle")}
          action={(
            <Button size="sm" disabled={!isS3Configured || triggerS3.isPending} onClick={() => triggerS3.mutate()}>
              {triggerS3.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <UploadCloud className="size-3.5" />}
              {t("backup.s3.triggerBackup")}
            </Button>
          )}
        />

        {s3Loading
          ? <div className="flex items-center justify-center py-10"><Loader2 className="size-5 animate-spin text-muted" /></div>
          : !isS3Configured
              ? (
                  <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                    <TriangleAlert className="size-7 text-amber" />
                    <p className="text-sm text-muted">{t("backup.s3.notConfigured")}</p>
                  </div>
                )
              : s3Backups.length === 0
                ? <EmptyRow icon={Database} text={t("backup.s3.empty")} />
                : (
                    <div className="divide-y divide-line">
                      {s3Backups.map(backup => (
                        <BackupRow
                          key={backup.key}
                          name={formatS3Key(backup.key)}
                          meta={`${formatBytes(backup.size)} · ${new Date(backup.lastModified).toLocaleString()}`}
                          restoreLabel={t("backup.s3.restore")}
                          restoreDisabled={restoreS3.isPending}
                          deleteDisabled={deleteS3.isPending}
                          onRestore={() => setRestoreS3Key(backup.key)}
                          onDelete={() => deleteS3.mutate(backup.key)}
                        />
                      ))}
                    </div>
                  )}
      </Panel>

      {/* Local Backups */}
      <Panel>
        <PanelHead
          icon={<Folder />}
          title={t("backup.local.title")}
          sub={t("backup.local.subtitle")}
          action={(
            <Button variant="outline" size="sm" disabled={triggerLocal.isPending} onClick={() => triggerLocal.mutate()}>
              {triggerLocal.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <UploadCloud className="size-3.5" />}
              {t("backup.local.triggerBackup")}
            </Button>
          )}
        />

        {localLoading
          ? <div className="flex items-center justify-center py-10"><Loader2 className="size-5 animate-spin text-muted" /></div>
          : localBackups.length === 0
            ? <EmptyRow icon={Database} text={t("backup.local.empty")} />
            : (
                <div className="divide-y divide-line">
                  {localBackups.map(backup => (
                    <BackupRow
                      key={backup.filePath}
                      name={backup.filename.replace(".dump", "")}
                      meta={`${formatBytes(backup.size)} · ${new Date(backup.lastModified).toLocaleString()}`}
                      restoreLabel={t("backup.local.restore")}
                      restoreDisabled={restoreLocal.isPending}
                      deleteDisabled={deleteLocal.isPending}
                      onRestore={() => setRestoreLocalPath(backup.filePath)}
                      onDelete={() => deleteLocal.mutate(backup.filePath)}
                    />
                  ))}
                </div>
              )}
      </Panel>

      {/* Client Backup */}
      <Panel>
        <PanelHead
          icon={<MonitorDown />}
          title={t("backup.client.title")}
          sub={t("backup.client.subtitle")}
          action={(
            <Button variant="outline" size="sm" disabled={download.isPending} onClick={() => download.mutate()}>
              {download.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              {t("backup.client.download")}
            </Button>
          )}
        />
      </Panel>

      {/* S3 Restore Dialog */}
      <Dialog open={!!restoreS3Key} onOpenChange={(open) => { if (!open) setRestoreS3Key(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("backup.s3.restore")}</DialogTitle>
            <DialogDescription>{t("backup.restoreConfirm")}</DialogDescription>
          </DialogHeader>
          {restoreS3Key && (
            <p className="truncate rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs text-ink">{formatS3Key(restoreS3Key)}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreS3Key(null)}>{t("backup.cancel")}</Button>
            <Button
              variant="danger"
              disabled={restoreS3.isPending}
              onClick={() => {
                if (!restoreS3Key) return;
                restoreS3.mutate(restoreS3Key, { onSettled: () => setRestoreS3Key(null) });
              }}
            >
              {restoreS3.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("backup.restoreConfirmAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Local Restore Dialog */}
      <Dialog open={!!restoreLocalPath} onOpenChange={(open) => { if (!open) setRestoreLocalPath(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("backup.local.restore")}</DialogTitle>
            <DialogDescription>{t("backup.restoreConfirm")}</DialogDescription>
          </DialogHeader>
          {restoreLocalPath && (
            <p className="truncate rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs text-ink">{restoreLocalPath}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreLocalPath(null)}>{t("backup.cancel")}</Button>
            <Button
              variant="danger"
              disabled={restoreLocal.isPending}
              onClick={() => {
                if (!restoreLocalPath) return;
                restoreLocal.mutate(restoreLocalPath, { onSettled: () => setRestoreLocalPath(null) });
              }}
            >
              {restoreLocal.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("backup.restoreConfirmAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { ENV } from "varlock/env";

import { api, ApiError } from "@/lib/http";

type S3BackupEntry = { key: string; size: number; lastModified: Date };
type S3BackupsResponse = { success: true; backups: S3BackupEntry[] };

export async function fetchS3Backups() {
  const res = await api.backups.$get();
  if (res.status === 422) return { success: true as const, backups: [] as S3BackupEntry[], configured: false as const };
  if (!res.ok) throw await ApiError.fromResponse(res);
  const { success, backups } = await res.json() as S3BackupsResponse;
  return { success, backups, configured: true as const };
}

export async function triggerS3BackupRequest() {
  const res = await api.backups.s3.$post();
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json();
}

export async function triggerLocalBackupRequest() {
  const res = await api.backups.local.$post();
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json();
}

export async function restoreFromS3Request(key: string) {
  const res = await api.backups.restore.s3.$post({ json: { key } });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json();
}

export async function restoreFromLocalRequest(filePath: string) {
  const res = await api.backups.restore.local.$post({ json: { filePath } });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json();
}

export type LocalBackupEntry = { filename: string; filePath: string; size: number; lastModified: string };

export async function fetchLocalBackups() {
  const res = await api.backups.local.$get();
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json() as unknown as { success: true; backups: LocalBackupEntry[] };
}

export async function deleteS3BackupRequest(key: string) {
  const res = await api.backups.s3.$delete({ json: { key } });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json();
}

export async function deleteLocalBackupRequest(filePath: string) {
  const res = await api.backups.local.$delete({ json: { filePath } });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json();
}

export async function downloadClientBackup(): Promise<void> {
  const res = await fetch(`${ENV.VITE_API_URL}/backups/download`, { credentials: "include" });
  if (!res.ok) throw await ApiError.fromResponse(res);
  const blob = await res.blob();
  const filename = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1]
    ?? `db-backup-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.dump`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

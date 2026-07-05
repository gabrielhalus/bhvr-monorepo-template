import type { QueryClient } from "@tanstack/react-query";

import {
  deleteLocalBackupRequest,
  deleteS3BackupRequest,
  downloadClientBackup,
  restoreFromLocalRequest,
  restoreFromS3Request,
  triggerLocalBackupRequest,
  triggerS3BackupRequest,
} from "./backup.api";
import { backupKeys } from "./backup.keys";

export function triggerS3BackupMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: triggerS3BackupRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.list });
    },
  };
}

export function triggerLocalBackupMutationOptions(queryClient: QueryClient) {
  type CacheData = Awaited<ReturnType<typeof import("./backup.api").fetchLocalBackups>>;
  return {
    mutationFn: triggerLocalBackupRequest,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: backupKeys.localList });
      const previous = queryClient.getQueryData<CacheData>(backupKeys.localList);
      const placeholder = {
        filename: `${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.dump`,
        filePath: "__pending__",
        size: 0,
        lastModified: new Date().toISOString(),
      };
      queryClient.setQueryData<CacheData>(backupKeys.localList, old =>
        old ? { ...old, backups: [placeholder, ...old.backups] } : old);
      return { previous };
    },
    onError: (_err: unknown, _vars: unknown, ctx: { previous: CacheData | undefined } | undefined) => {
      if (ctx?.previous) queryClient.setQueryData(backupKeys.localList, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.localList });
    },
  };
}

export function downloadClientBackupMutationOptions() {
  return {
    mutationFn: downloadClientBackup,
  };
}

export function restoreFromS3MutationOptions() {
  return {
    mutationFn: (key: string) => restoreFromS3Request(key),
  };
}

export function restoreFromLocalMutationOptions() {
  return {
    mutationFn: (filePath: string) => restoreFromLocalRequest(filePath),
  };
}

export function deleteS3BackupMutationOptions(queryClient: QueryClient) {
  type CacheData = Awaited<ReturnType<typeof import("./backup.api").fetchS3Backups>>;
  return {
    mutationFn: (key: string) => deleteS3BackupRequest(key),
    onMutate: async (key: string) => {
      await queryClient.cancelQueries({ queryKey: backupKeys.list });
      const previous = queryClient.getQueryData<CacheData>(backupKeys.list);
      queryClient.setQueryData<CacheData>(backupKeys.list, old =>
        old ? { ...old, backups: old.backups.filter(b => b.key !== key) } : old);
      return { previous };
    },
    onError: (_err: unknown, _key: string, ctx: { previous: CacheData | undefined } | undefined) => {
      if (ctx?.previous) queryClient.setQueryData(backupKeys.list, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.list });
    },
  };
}

export function deleteLocalBackupMutationOptions(queryClient: QueryClient) {
  type CacheData = Awaited<ReturnType<typeof import("./backup.api").fetchLocalBackups>>;
  return {
    mutationFn: (filePath: string) => deleteLocalBackupRequest(filePath),
    onMutate: async (filePath: string) => {
      await queryClient.cancelQueries({ queryKey: backupKeys.localList });
      const previous = queryClient.getQueryData<CacheData>(backupKeys.localList);
      queryClient.setQueryData<CacheData>(backupKeys.localList, old =>
        old ? { ...old, backups: old.backups.filter(b => b.filePath !== filePath) } : old);
      return { previous };
    },
    onError: (_err: unknown, _filePath: string, ctx: { previous: CacheData | undefined } | undefined) => {
      if (ctx?.previous) queryClient.setQueryData(backupKeys.localList, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.localList });
    },
  };
}

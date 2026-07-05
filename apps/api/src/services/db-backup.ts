import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { ENV } from "varlock/env";

import { getConfigs } from "~shared/queries/configs.queries";

const BACKUP_PREFIX = "backups/db/";
const RETENTION_DAYS = 7;

// ─── S3 Backup ───────────────────────────────────────────────────────────────

export async function runDatabaseBackup(): Promise<string> {
  const { client, bucket } = await getBackupS3();
  const dump = await dumpDatabase();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const key = `${BACKUP_PREFIX}${timestamp}.dump`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: dump,
      ContentType: "application/octet-stream",
    }),
  );

  const pruned = await pruneOldBackups(client, bucket);

  return `Uploaded ${key} (${(dump.byteLength / 1024).toFixed(1)} KB), pruned ${pruned} old backup(s)`;
}

export type S3BackupEntry = {
  key: string;
  size: number;
  lastModified: Date;
};

export async function listS3Backups(): Promise<S3BackupEntry[]> {
  const { client, bucket } = await getBackupS3();

  const list = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: BACKUP_PREFIX }),
  );

  return (list.Contents ?? [])
    .filter((obj): obj is { Key: string; Size: number; LastModified: Date } => !!(obj.Key && obj.LastModified && obj.Size !== undefined))
    .map(obj => ({ key: obj.Key, size: obj.Size, lastModified: obj.LastModified }))
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

export async function deleteS3Backup(key: string): Promise<void> {
  const { client, bucket } = await getBackupS3();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function restoreFromS3(key: string): Promise<string> {
  const { client, bucket } = await getBackupS3();

  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );

  if (!response.Body) {
    throw new Error(`Backup object "${key}" has no body`);
  }

  const dumpBytes = await response.Body.transformToByteArray();
  await restoreDatabase(dumpBytes);

  return `Restored from S3 key "${key}" (${(dumpBytes.byteLength / 1024).toFixed(1)} KB)`;
}

// ─── Local Backup ─────────────────────────────────────────────────────────────

export async function backupToLocal(): Promise<string> {
  const { localDir } = await getBackupS3();
  const dump = await dumpDatabase();

  await mkdir(localDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filepath = join(localDir, `${timestamp}.dump`);

  await Bun.write(filepath, dump);

  return `Saved ${filepath} (${(dump.byteLength / 1024).toFixed(1)} KB)`;
}

export type LocalBackupEntry = {
  filename: string;
  filePath: string;
  size: number;
  lastModified: Date;
};

export async function listLocalBackups(): Promise<LocalBackupEntry[]> {
  const { localDir } = await getBackupS3();

  let files: string[];
  try {
    files = await readdir(localDir);
  } catch {
    return [];
  }

  const entries = await Promise.all(
    files
      .filter(f => f.endsWith(".dump"))
      .map(async (filename) => {
        const filePath = join(localDir, filename);
        const s = await stat(filePath);
        return { filename, filePath, size: s.size, lastModified: s.mtime };
      }),
  );

  return entries.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

export async function deleteLocalBackup(filePath: string): Promise<void> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) throw new Error(`Local backup file not found: ${filePath}`);
  await unlink(filePath);
}

export async function restoreFromLocal(filePath: string): Promise<string> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    throw new Error(`Local backup file not found: ${filePath}`);
  }

  const dumpBytes = new Uint8Array(await file.arrayBuffer());
  await restoreDatabase(dumpBytes);

  return `Restored from local file "${filePath}" (${(dumpBytes.byteLength / 1024).toFixed(1)} KB)`;
}

// ─── Internals ────────────────────────────────────────────────────────────────

type BackupS3 = { client: S3Client; bucket: string; localDir: string };

export async function isS3BackupConfigured(): Promise<boolean> {
  const configs = await getConfigs(["storage.s3.endpoint", "storage.s3.accessKey", "storage.s3.secretKey"]);
  const cm = Object.fromEntries(configs.map(c => [c.configKey, c.value]));
  return !!(cm["storage.s3.endpoint"] && cm["storage.s3.accessKey"] && cm["storage.s3.secretKey"]);
}

async function getBackupS3(): Promise<BackupS3> {
  const configs = await getConfigs([
    "storage.s3.endpoint",
    "storage.s3.accessKey",
    "storage.s3.secretKey",
    "storage.s3.region",
    "backup.bucket",
    "backup.local.dir",
  ]);
  const cm = Object.fromEntries(configs.map(c => [c.configKey, c.value]));

  const endpoint = cm["storage.s3.endpoint"];
  const accessKey = cm["storage.s3.accessKey"];
  const secretKey = cm["storage.s3.secretKey"];

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error("S3 not configured — set storage.s3.endpoint, storage.s3.accessKey, and storage.s3.secretKey");
  }

  const client = new S3Client({
    endpoint,
    region: cm["storage.s3.region"] ?? "us-east-1",
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: true,
  });

  return {
    client,
    bucket: cm["backup.bucket"] ?? "backups",
    localDir: cm["backup.local.dir"] ?? "/tmp/db-backups",
  };
}

/* eslint-disable node/no-process-env -- pg_dump/pg_restore subprocesses need the full parent environment */
function pgBinPath(): string {
  return [
    "/opt/homebrew/opt/postgresql@16/bin", // prefer version-matched client tools
    "/opt/homebrew/opt/libpq/bin", // fallback (may be newer than server)
    "/usr/local/bin",
    process.env.PATH ?? "",
  ].join(":");
}

export async function dumpDatabase(): Promise<Uint8Array> {
  const url = new URL(ENV.DATABASE_URL);

  const proc = Bun.spawn(["pg_dump", "--format=custom", "--no-acl", "--no-owner"], {
    env: {
      ...process.env,
      PATH: pgBinPath(),
      PGHOST: url.hostname,
      PGPORT: url.port || "5432",
      PGUSER: decodeURIComponent(url.username),
      PGPASSWORD: decodeURIComponent(url.password),
      PGDATABASE: url.pathname.slice(1),
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  const [dumpBuffer, stderrText, exitCode] = await Promise.all([
    new Response(proc.stdout).arrayBuffer(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(`pg_dump failed (exit ${exitCode}): ${stderrText.trim()}`);
  }

  return new Uint8Array(dumpBuffer);
}

async function restoreDatabase(dumpBytes: Uint8Array): Promise<void> {
  const url = new URL(ENV.DATABASE_URL);
  const tmpFile = `/tmp/pg_restore_${Date.now()}.dump`;

  try {
    await Bun.write(tmpFile, dumpBytes);

    const proc = Bun.spawn(
      ["pg_restore", "--format=custom", "--no-acl", "--no-owner", "--clean", "--if-exists", "-d", url.pathname.slice(1), tmpFile],
      {
        env: {
          ...process.env,
          PATH: pgBinPath(),
          PGHOST: url.hostname,
          PGPORT: url.port || "5432",
          PGUSER: decodeURIComponent(url.username),
          PGPASSWORD: decodeURIComponent(url.password),
        },
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const [stderrText, exitCode] = await Promise.all([
      new Response(proc.stderr).text(),
      proc.exited,
    ]);

    // pg_restore exits with 1 for non-fatal warnings (e.g. unrecognized GUC from a newer pg_dump
    // client version like "transaction_timeout"). Exit code 3 means a fatal error that aborted the
    // restore entirely. We only throw for that case.
    if (exitCode >= 3) {
      throw new Error(`pg_restore failed (exit ${exitCode}): ${stderrText.trim()}`);
    }
    if (exitCode === 1 && stderrText.trim()) {
      console.warn(`[pg_restore] completed with warnings:\n${stderrText.trim()}`);
    }
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

async function pruneOldBackups(client: S3Client, bucket: string): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  const list = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: BACKUP_PREFIX }),
  );

  const stale = (list.Contents ?? []).filter(
    obj => obj.Key && obj.LastModified && obj.LastModified < cutoff,
  );

  for (const obj of stale) {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key! }));
  }

  return stale.length;
}

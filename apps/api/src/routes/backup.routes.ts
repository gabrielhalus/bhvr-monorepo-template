import type { AppContext } from "@/utils/hono";

import { Hono } from "hono";
import { z } from "zod";

import { requirePermissionFactory } from "@/middlewares/access-control";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { backupToLocal, deleteLocalBackup, deleteS3Backup, dumpDatabase, isS3BackupConfigured, listLocalBackups, listS3Backups, restoreFromLocal, restoreFromS3, runDatabaseBackup } from "@/services/db-backup";

async function requireS3Backup(c: AppContext): Promise<Response | null> {
  if (!await isS3BackupConfigured()) {
    return c.json({ success: false as const, error: "S3 not configured — set storage.s3.endpoint, storage.s3.accessKey, and storage.s3.secretKey" }, 422);
  }
  return null;
}

export const backupRoutes = new Hono()
  .use(getSessionContext)

  /**
   * List available S3 backups
   * @permission backup:list
   */
  .get("/", requirePermissionFactory("backup:list"), async (c) => {
    const guard = await requireS3Backup(c);
    if (guard) return guard;
    const backups = await listS3Backups();
    return c.json({ success: true as const, backups });
  })

  /**
   * List available local (filesystem) backups
   * @permission backup:list
   */
  .get("/local", requirePermissionFactory("backup:list"), async (c) => {
    const backups = await listLocalBackups();
    return c.json({ success: true as const, backups });
  })

  /**
   * Stream a live pg_dump directly to the client as a file download
   * @permission backup:create
   */
  .get("/download", requirePermissionFactory("backup:create"), async (): Promise<Response> => {
    const dump = await dumpDatabase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    return new Response(dump, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="db-backup-${timestamp}.dump"`,
        "Content-Type": "application/octet-stream",
      },
    });
  })

  /**
   * Trigger an immediate database backup to S3
   * @permission backup:create
   */
  .post("/s3", requirePermissionFactory("backup:create"), async (c) => {
    const guard = await requireS3Backup(c);
    if (guard) return guard;
    const message = await runDatabaseBackup();
    return c.json({ success: true as const, message });
  })

  /**
   * Trigger a full database backup to the local filesystem (backup.local.dir)
   * @permission backup:create
   */
  .post("/local", requirePermissionFactory("backup:create"), async (c) => {
    const message = await backupToLocal();
    return c.json({ success: true as const, message });
  })

  /**
   * Delete an S3 backup by key
   * @permission backup:create
   */
  .delete(
    "/s3",
    validationMiddleware("json", z.object({ key: z.string().min(1) })),
    requirePermissionFactory("backup:create"),
    async (c) => {
      const guard = await requireS3Backup(c);
      if (guard) return guard;
      const { key } = c.req.valid("json");
      await deleteS3Backup(key);
      return c.json({ success: true as const });
    },
  )

  /**
   * Delete a local backup file
   * @permission backup:create
   */
  .delete(
    "/local",
    validationMiddleware("json", z.object({ filePath: z.string().min(1) })),
    requirePermissionFactory("backup:create"),
    async (c) => {
      const { filePath } = c.req.valid("json");
      await deleteLocalBackup(filePath);
      return c.json({ success: true as const });
    },
  )

  /**
   * Restore the database from an S3 backup key — destructive, drops and recreates all objects
   * @permission backup:restore
   */
  .post(
    "/restore/s3",
    validationMiddleware("json", z.object({ key: z.string().min(1) })),
    requirePermissionFactory("backup:restore"),
    async (c) => {
      const guard = await requireS3Backup(c);
      if (guard) return guard;
      const { key } = c.req.valid("json");
      const message = await restoreFromS3(key);
      return c.json({ success: true as const, message });
    },
  )

  /**
   * Restore the database from a local dump file — destructive, drops and recreates all objects
   * @permission backup:restore
   */
  .post(
    "/restore/local",
    validationMiddleware("json", z.object({ filePath: z.string().min(1) })),
    requirePermissionFactory("backup:restore"),
    async (c) => {
      const { filePath } = c.req.valid("json");
      const message = await restoreFromLocal(filePath);
      return c.json({ success: true as const, message });
    },
  );

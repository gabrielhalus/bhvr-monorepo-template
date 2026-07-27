import { CreateBucketCommand, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getConfigs } from "~shared/queries/configs.queries";

// ─── Bucket registry ─────────────────────────────────────────────────────────
//
// Logical bucket name → the config key holding its physical bucket name. A single
// S3 connection (endpoint + credentials in `storage.s3.*`) serves every bucket;
// only the target bucket varies per purpose. The socle ships `core` (branding,
// avatars); forks extend this map with their own named buckets and add the
// matching `storage.s3.bucket*` entries to config.registry.ts.

export const STORAGE_BUCKETS = {
  core: "storage.s3.bucket",
} as const;

export type BucketName = keyof typeof STORAGE_BUCKETS;

// ─── Key Helpers ─────────────────────────────────────────────────────────────

export const objectKeys = {
  brandingLogo: (ext: string) => `branding/logo.${ext}`,
  brandingFavicon: (ext: string) => `branding/favicon.${ext}`,
  userAvatar: (userId: string, ext: string) => `users/${userId}/avatar.${ext}`,
} as const;

/** Maps an image content type to a file extension (defaults to `bin`). */
export function imageExtFromContentType(contentType: string): string | null {
  switch (contentType) {
    case "image/png": return "png";
    case "image/jpeg": return "jpg";
    case "image/webp": return "webp";
    case "image/avif": return "avif";
    case "image/gif": return "gif";
    default: return null;
  }
}

/** Best-effort content type from an object key extension. */
export function contentTypeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "webp": return "image/webp";
    case "avif": return "image/avif";
    case "gif": return "image/gif";
    default: return "application/octet-stream";
  }
}

// ─── Config ──────────────────────────────────────────────────────────────────

export async function isStorageConfigured(): Promise<boolean> {
  const configs = await getConfigs(["storage.s3.endpoint", "storage.s3.accessKey", "storage.s3.secretKey"]);
  const cm = Object.fromEntries(configs.map(c => [c.configKey, c.value]));
  return !!(cm["storage.s3.endpoint"] && cm["storage.s3.accessKey"] && cm["storage.s3.secretKey"]);
}

type StorageConnection = {
  client: S3Client;
  buckets: Record<BucketName, string>;
};

async function getStorageS3(): Promise<StorageConnection> {
  const bucketKeys = Object.values(STORAGE_BUCKETS);
  const configs = await getConfigs([
    "storage.s3.endpoint",
    "storage.s3.accessKey",
    "storage.s3.secretKey",
    "storage.s3.region",
    ...bucketKeys,
  ]);
  const cm = Object.fromEntries(configs.map(c => [c.configKey, c.value]));

  const endpoint = cm["storage.s3.endpoint"];
  const accessKey = cm["storage.s3.accessKey"];
  const secretKey = cm["storage.s3.secretKey"];

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error("Storage not configured — set storage.s3.endpoint, storage.s3.accessKey, and storage.s3.secretKey");
  }

  const client = new S3Client({
    endpoint,
    region: cm["storage.s3.region"] ?? "us-east-1",
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: true,
  });

  const buckets = Object.fromEntries(
    (Object.entries(STORAGE_BUCKETS) as Array<[BucketName, string]>).map(
      ([name, key]) => [name, cm[key] ?? name],
    ),
  ) as Record<BucketName, string>;

  return { client, buckets };
}

// ─── Bucket provisioning ─────────────────────────────────────────────────────

/**
 * Create a bucket if it does not already exist, swallowing the "already there"
 * and "insufficient rights" cases so provisioning is always best-effort — prod
 * deployments may pre-create buckets with credentials that lack CreateBucket.
 */
async function createBucketIfMissing(client: S3Client, bucket: string): Promise<void> {
  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  } catch {
    // Best-effort: the bucket already exists, or the credentials lack CreateBucket
    // and the bucket is provisioned out-of-band. Either way this is non-fatal —
    // an operation that genuinely needs the bucket will surface a clear error.
  }
}

/**
 * Provision every registered bucket. Called at API boot (best-effort) so buckets
 * exist without a manual step. No-ops silently when storage is not configured yet.
 */
export async function ensureStorageBuckets(): Promise<void> {
  let conn: StorageConnection;
  try {
    conn = await getStorageS3();
  } catch {
    return;
  }
  await Promise.all(Object.values(conn.buckets).map(b => createBucketIfMissing(conn.client, b)));
}

// ─── Operations ──────────────────────────────────────────────────────────────

export async function putObject(bucket: BucketName, key: string, bytes: Uint8Array, contentType: string): Promise<void> {
  const { client, buckets } = await getStorageS3();
  await client.send(
    new PutObjectCommand({
      Bucket: buckets[bucket],
      Key: key,
      Body: bytes,
      ContentType: contentType,
    }),
  );
}

export async function getObject(bucket: BucketName, key: string): Promise<{ bytes: Uint8Array<ArrayBuffer>; contentType: string }> {
  const { client, buckets } = await getStorageS3();
  const res = await client.send(new GetObjectCommand({ Bucket: buckets[bucket], Key: key }));
  const bytes = new Uint8Array(await res.Body!.transformToByteArray());
  return { bytes, contentType: res.ContentType ?? contentTypeFromKey(key) };
}

export async function deleteObject(bucket: BucketName, key: string): Promise<void> {
  const { client, buckets } = await getStorageS3();
  await client.send(new DeleteObjectCommand({ Bucket: buckets[bucket], Key: key }));
}

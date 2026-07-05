import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getConfigs } from "~shared/queries/configs.queries";

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

async function getStorageS3(): Promise<{ client: S3Client; bucket: string }> {
  const configs = await getConfigs([
    "storage.s3.endpoint",
    "storage.s3.accessKey",
    "storage.s3.secretKey",
    "storage.s3.bucket",
    "storage.s3.region",
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

  return { client, bucket: cm["storage.s3.bucket"] ?? "documents" };
}

// ─── Operations ──────────────────────────────────────────────────────────────

export async function uploadImage(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
  const { client, bucket } = await getStorageS3();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
    }),
  );
}

export async function getObject(key: string): Promise<{ bytes: Uint8Array<ArrayBuffer>; contentType: string }> {
  const { client, bucket } = await getStorageS3();
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = new Uint8Array(await res.Body!.transformToByteArray());
  return { bytes, contentType: res.ContentType ?? contentTypeFromKey(key) };
}

export async function deleteObject(key: string): Promise<void> {
  const { client, bucket } = await getStorageS3();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

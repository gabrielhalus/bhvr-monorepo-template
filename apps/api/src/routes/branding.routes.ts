import { Hono } from "hono";
import { z } from "zod";

import { fetchImageFromUrl, ImageFetchError } from "@/lib/fetch-image-url";
import { contentTypeFromKey, deleteObject, getObject, imageExtFromContentType, objectKeys, uploadImage } from "@/lib/s3/storage";
import { requirePermissionFactory } from "@/middlewares/access-control";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { getConfig, updateConfig } from "~shared/queries/configs.queries";

const MAX_BYTES = 5 * 1024 * 1024;

const FromUrlBodySchema = z.object({ url: z.string().url() });

type BrandingAsset = {
  configKey: "branding.logoUrl" | "branding.faviconUrl";
  objectKey: (ext: string) => string;
  label: string;
};

const LOGO: BrandingAsset = {
  configKey: "branding.logoUrl",
  objectKey: objectKeys.brandingLogo,
  label: "logo",
};

const FAVICON: BrandingAsset = {
  configKey: "branding.faviconUrl",
  objectKey: objectKeys.brandingFavicon,
  label: "favicon",
};

function makeAssetRoutes(asset: BrandingAsset) {
  return new Hono()
    /**
     * Serve the branding asset — no auth required (used on login/invite pages).
     */
    .get("/", async (c) => {
      const s3Key = (await getConfig(asset.configKey))?.value ?? null;
      if (!s3Key) {
        return c.json({ success: false as const, error: "Not Found" }, 404);
      }
      const { bytes, contentType } = await getObject(s3Key);
      return c.newResponse(bytes, 200, {
        "Content-Type": contentType || contentTypeFromKey(s3Key),
        "Cache-Control": "public, max-age=300",
      });
    })

    /**
     * Upload or replace the branding asset (file or URL).
     * Body: multipart with `file` field, or JSON `{ url: string }`.
     */
    .post(
      "/",
      getSessionContext,
      requirePermissionFactory("config:update"),
      async (c) => {
        const { user } = c.var.sessionContext;
        const ct = c.req.header("content-type") ?? "";

        let bytes: Uint8Array;
        let contentType: string;
        let ext: string;

        if (ct.includes("application/json")) {
          let url: string;
          try {
            ({ url } = FromUrlBodySchema.parse(await c.req.json()));
          } catch {
            return c.json({ success: false as const, error: "Champ url manquant ou invalide" }, 400);
          }
          try {
            ({ bytes, contentType, ext } = await fetchImageFromUrl(url, { maxBytes: MAX_BYTES }));
          } catch (err) {
            return c.json({ success: false as const, error: err instanceof ImageFetchError ? err.message : "Échec du téléchargement" }, 400);
          }
        } else {
          const body = await c.req.parseBody();
          const file = body.file;
          if (!(file instanceof File)) {
            return c.json({ success: false as const, error: "Aucun fichier fourni" }, 400);
          }
          const fileExt = imageExtFromContentType(file.type);
          if (!fileExt) {
            return c.json({ success: false as const, error: "Type d'image non supporté" }, 400);
          }
          if (file.size > MAX_BYTES) {
            return c.json({ success: false as const, error: "Image trop volumineuse" }, 400);
          }
          ext = fileExt;
          contentType = file.type;
          bytes = new Uint8Array(await file.arrayBuffer());
        }

        const s3Key = asset.objectKey(ext);
        await uploadImage(s3Key, bytes, contentType);

        const previousKey = (await getConfig(asset.configKey))?.value ?? null;
        if (previousKey && previousKey !== s3Key) {
          try {
            await deleteObject(previousKey);
          } catch {}
        }

        await updateConfig(asset.configKey, s3Key, user.id);
        return c.json({ success: true as const, key: s3Key });
      },
    )

    /**
     * Remove the branding asset.
     */
    .delete(
      "/",
      getSessionContext,
      requirePermissionFactory("config:update"),
      async (c) => {
        const { user } = c.var.sessionContext;
        const s3Key = (await getConfig(asset.configKey))?.value ?? null;
        if (s3Key) {
          try {
            await deleteObject(s3Key);
          } catch {}
        }
        await updateConfig(asset.configKey, null, user.id);
        return c.json({ success: true as const });
      },
    );
}

export const brandingRoutes = new Hono()
  .route("/logo", makeAssetRoutes(LOGO))
  .route("/favicon", makeAssetRoutes(FAVICON));

// Validation helper re-exported for the from-url schema use in tests.
export { FromUrlBodySchema, validationMiddleware };

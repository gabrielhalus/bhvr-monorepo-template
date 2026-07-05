import type { Config } from "~shared/types/db/configs.types";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ENV } from "varlock/env";

import {
  deleteBrandingFavicon,
  deleteBrandingLogo,
  uploadBrandingFavicon,
  uploadBrandingFaviconFromUrl,
  uploadBrandingLogo,
  uploadBrandingLogoFromUrl,
} from "@/api/branding/branding.api";
import { configsKeys } from "@/api/configs/configs.keys";
import { ImageUrlImportDialog } from "@/components/image-url-import-dialog";
import { Button } from "~orbit/components/ui/Button";
import { ImagePlus, Link, Loader2, Trash2 } from "~orbit/components/ui/icons";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = "image/png,image/jpeg,image/webp,image/gif,image/avif";

type ConfigImageUploaderProps = {
  config: Config;
};

/** Maps config key → upload/delete/serve endpoint handlers. */
const ASSET_HANDLERS: Record<string, {
  serveUrl: () => string;
  upload: (file: File) => Promise<unknown>;
  uploadFromUrl: (url: string) => Promise<unknown>;
  remove: () => Promise<unknown>;
  i18nKey: string;
}> = {
  "branding.logoUrl": {
    serveUrl: () => `${String(ENV.VITE_API_URL).replace(/\/$/, "")}/branding/logo?v=${Date.now()}`,
    upload: uploadBrandingLogo,
    uploadFromUrl: uploadBrandingLogoFromUrl,
    remove: deleteBrandingLogo,
    i18nKey: "settings.config.branding.logoUrl",
  },
  "branding.faviconUrl": {
    serveUrl: () => `${String(ENV.VITE_API_URL).replace(/\/$/, "")}/branding/favicon?v=${Date.now()}`,
    upload: uploadBrandingFavicon,
    uploadFromUrl: uploadBrandingFaviconFromUrl,
    remove: deleteBrandingFavicon,
    i18nKey: "settings.config.branding.faviconUrl",
  },
};

/**
 * Image uploader rendered by NodeForm when config.type === "image".
 * Handles file pick, URL import and removal for known branding assets.
 */
export function ConfigImageUploader({ config }: ConfigImageUploaderProps) {
  const asset = ASSET_HANDLERS[config.configKey];
  if (!asset) return null;

  return <AssetUploader config={config} asset={asset} />;
}

type AssetUploadProps = {
  config: Config;
  asset: NonNullable<typeof ASSET_HANDLERS[string]>;
};

function AssetUploader({ config, asset }: AssetUploadProps) {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [urlImportOpen, setUrlImportOpen] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);

  const hasImage = Boolean(config.value);
  const i18n = asset.i18nKey;

  async function runAction(action: () => Promise<unknown>, successKey: string) {
    setBusy(true);
    try {
      await action();
      await queryClient.invalidateQueries({ queryKey: configsKeys.all });
      setImageVersion(v => v + 1);
      toast.success(t(`${i18n}.${successKey}` as never));
    } catch {
      toast.error(t(`${i18n}.uploadError` as never));
    } finally {
      setBusy(false);
    }
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    if (file.size > MAX_BYTES) {
      toast.error(t(`${i18n}.tooLarge` as never));
      return;
    }
    runAction(() => asset.upload(file), "uploaded");
  }

  async function importFromUrl(url: string) {
    await asset.uploadFromUrl(url);
    await queryClient.invalidateQueries({ queryKey: configsKeys.all });
    setImageVersion(v => v + 1);
    toast.success(t(`${i18n}.uploaded` as never));
  }

  function remove() {
    runAction(() => asset.remove(), "removed");
  }

  return (
    <div className="flex items-start gap-4">
      {/* Preview */}
      <button
        type="button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        className="group relative size-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line bg-surface-2 transition-colors hover:border-accent/40 disabled:pointer-events-none"
      >
        {hasImage
          ? <img key={imageVersion} src={asset.serveUrl()} alt="" className="size-full object-contain" />
          : <ImagePlus className="size-5 text-faint transition-colors group-hover:text-accent" />}
        <span className="absolute inset-0 grid place-items-center bg-ink/50 opacity-0 transition-opacity group-hover:opacity-100">
          {busy
            ? <Loader2 className="size-4 animate-spin text-white" />
            : <ImagePlus className="size-4 text-white" />}
        </span>
        {busy && !hasImage && (
          <span className="absolute inset-0 grid place-items-center">
            <Loader2 className="size-4 animate-spin text-faint" />
          </span>
        )}
      </button>

      <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden" onChange={pickFile} />

      <ImageUrlImportDialog
        open={urlImportOpen}
        onOpenChange={setUrlImportOpen}
        onImport={importFromUrl}
      />

      {/* Actions + label */}
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            <ImagePlus className="size-3.5" />
            {hasImage
              ? t(`${i18n}.change` as never)
              : t(`${i18n}.add` as never)}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setUrlImportOpen(true)}>
            <Link className="size-3.5" />
            {t("imageUpload.urlOption")}
          </Button>
          {hasImage && (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={remove} className="text-coral-deep hover:bg-coral/10 hover:text-coral-deep">
              <Trash2 className="size-3.5" />
              {t(`${i18n}.remove` as never)}
            </Button>
          )}
        </div>
        <p className="text-[11px] leading-relaxed text-faint">
          PNG, JPG, WebP, GIF · max 5 Mo
        </p>
      </div>
    </div>
  );
}

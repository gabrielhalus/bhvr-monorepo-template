import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { deleteAvatar, uploadAvatar, uploadAvatarFromUrl, userAvatarUrl } from "@/api/account/account.api";
import { ImageUrlImportDialog } from "@/components/image-url-import-dialog";
import { useAuth } from "@/hooks/use-auth";
import { authQueryOptions } from "@/queries/auth";
import { Avatar } from "~orbit/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~orbit/components/ui/DropdownMenu";
import { ImagePlus, Link, Loader2, Trash2 } from "~orbit/components/ui/icons";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];

/** Profile photo with upload / replace / remove, shown in the account head. */
export function AvatarUploader({ name }: { name: string }) {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [urlImportOpen, setUrlImportOpen] = useState(false);

  const src = localImage ?? userAvatarUrl(user.avatar, user.updatedAt) ?? undefined;

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error(t("account.photo.invalidType"));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t("account.photo.tooLarge"));
      return;
    }

    if (localImage) URL.revokeObjectURL(localImage);
    setLocalImage(URL.createObjectURL(file));
    setBusy(true);
    try {
      await uploadAvatar(file);
      await queryClient.invalidateQueries({ queryKey: authQueryOptions.queryKey });
      toast.success(t("account.photo.uploaded"));
    } catch {
      toast.error(t("account.photo.uploadError"));
      if (localImage) URL.revokeObjectURL(localImage);
      setLocalImage(null);
    } finally {
      setBusy(false);
    }
  }

  async function importFromUrl(url: string) {
    await uploadAvatarFromUrl(url);
    await queryClient.invalidateQueries({ queryKey: authQueryOptions.queryKey });
    toast.success(t("account.photo.uploaded"));
  }

  async function removePhoto() {
    if (busy) return;
    setBusy(true);
    try {
      await deleteAvatar();
      if (localImage) URL.revokeObjectURL(localImage);
      setLocalImage(null);
      await queryClient.invalidateQueries({ queryKey: authQueryOptions.queryKey });
      toast.success(t("account.photo.removed"));
    } catch {
      toast.error(t("account.photo.uploadError"));
    } finally {
      setBusy(false);
    }
  }

  const hasPhoto = Boolean(localImage || user.avatar);

  return (
    <div className="relative shrink-0">
      <Avatar size="lg" name={name} src={src} />

      {busy && (
        <div className="absolute inset-0 grid place-items-center rounded-full bg-ink/40 text-white">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />

      <ImageUrlImportDialog
        open={urlImportOpen}
        onOpenChange={setUrlImportOpen}
        onImport={importFromUrl}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={busy}
            aria-label={t("account.photo.menuLabel")}
            className="absolute -bottom-0.5 -right-0.5 grid size-7 place-items-center rounded-full border-2 border-surface bg-accent text-white shadow-soft transition-colors hover:bg-accent-deep focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:opacity-50"
          >
            <ImagePlus className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>
            <ImagePlus />
            {t("account.photo.change")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setUrlImportOpen(true)}>
            <Link />
            {t("imageUpload.urlOption")}
          </DropdownMenuItem>
          {hasPhoto && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="danger" onClick={removePhoto}>
                <Trash2 />
                {t("account.photo.remove")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

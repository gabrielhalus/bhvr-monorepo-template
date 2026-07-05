import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~orbit/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~orbit/components/ui/Dialog";
import { Link } from "~orbit/components/ui/icons";
import { Input } from "~orbit/components/ui/Input";

type ImageUrlImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (url: string) => Promise<void>;
};

/**
 * Small dialog prompting for an HTTPS image URL. The parent is responsible
 * for the actual upload — onImport receives the raw URL string.
 */
export function ImageUrlImportDialog({ open, onOpenChange, onImport }: ImageUrlImportDialogProps) {
  const { t } = useTranslation("web");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose(next: boolean) {
    if (busy) return;
    if (!next) {
      setUrl("");
      setError(null);
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await onImport(trimmed);
      setUrl("");
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t("imageUpload.urlImportError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("imageUpload.urlImportTitle")}</DialogTitle>
          <DialogDescription>{t("imageUpload.urlImportDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
              <Input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                disabled={busy}
                autoFocus
                className="pl-8"
              />
            </div>
          </div>

          {error && <p className="text-[11px] text-coral-deep">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => handleClose(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={busy || !url.trim()}>
              {busy ? t("imageUpload.importing") : t("imageUpload.importButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

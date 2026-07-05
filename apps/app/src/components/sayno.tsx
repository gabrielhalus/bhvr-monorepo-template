import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { handleDialogResult } from "@/lib/sayno";
import { Button } from "~orbit/components/ui/Button";
import { Dialog, DialogContent } from "~orbit/components/ui/Dialog";
import { HelpCircle, TriangleAlert } from "~orbit/components/ui/icons";

type Variant = "default" | "destructive" | "success";

type Options = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: Variant;
};

type DialogState = {
  open: boolean;
  options: Options;
};

/**
 * Orbit-native confirm/alert dialog. Driven imperatively by `@/lib/sayno`
 * (the kept event bus) — listens to the `sayno-update` event and resolves the
 * pending promise via `handleDialogResult`.
 */
export function Sayno() {
  const { t } = useTranslation();

  const [state, setState] = useState<DialogState>({ open: false, options: {} });
  const [displayed, setDisplayed] = useState<Options>({});

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail as DialogState;
      setState(detail);
      if (detail.open) setDisplayed(detail.options ?? {});
    };
    window.addEventListener("sayno-update", handleUpdate);
    return () => window.removeEventListener("sayno-update", handleUpdate);
  }, []);

  const {
    title = t("dialog.confirmTitle"),
    description = t("dialog.confirmDescription"),
    confirmText = t("actions.confirm"),
    cancelText = t("actions.cancel"),
    variant = "default",
  } = displayed;

  const isDestructive = variant === "destructive";
  const Icon = isDestructive ? TriangleAlert : HelpCircle;

  return (
    <Dialog open={state.open} onOpenChange={open => !open && handleDialogResult(false)}>
      <DialogContent showClose={false} className="max-w-100 gap-0 text-center">
        <div
          className={
            isDestructive
              ? "mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-coral-soft text-coral-deep"
              : "mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-deep"
          }
        >
          <Icon className="size-6" strokeWidth={1.75} />
        </div>

        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        <p className="mt-2 text-sm/relaxed text-muted">{description}</p>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => handleDialogResult(false)}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? "danger" : "primary"}
            className="flex-1"
            onClick={() => handleDialogResult(true)}
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

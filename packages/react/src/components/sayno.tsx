import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~react/components/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~react/components/dialog";
import { handleDialogResult } from "~react/lib/sayno";

type DialogState = {
  open: boolean;
  options: {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
  };
  resolve: ((value: boolean) => void) | null;
};

function Sayno() {
  const { t } = useTranslation();

  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    options: {},
    resolve: null,
  });

  // Separate state to hold the displayed options that only updates when dialog is closed
  const [displayedOptions, setDisplayedOptions] = useState<DialogState["options"]>({});

  useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      const newState = event.detail;
      setDialogState(newState);

      // If dialog is opening, update the displayed options immediately
      if (newState.open && !dialogState.open) {
        setDisplayedOptions(newState.options);
      }
    };

    window.addEventListener("sayno-update", handleUpdate as EventListener);

    return () => {
      window.removeEventListener("sayno-update", handleUpdate as EventListener);
    };
  }, [dialogState.open]);

  // Update displayed options only after dialog closes
  useEffect(() => {
    if (!dialogState.open && dialogState.options !== displayedOptions) {
      // Wait a bit for the dialog to fully close before updating text
      const timer = setTimeout(() => {
        setDisplayedOptions(dialogState.options);
      }, 300); // Adjust timing as needed for your dialog animation

      return () => clearTimeout(timer);
    }
  }, [dialogState.open, dialogState.options, displayedOptions]);

  const {
    title = t("dialog.confirmTitle"),
    description = t("dialog.confirmDescription"),
    confirmText = t("actions.confirm"),
    cancelText = t("actions.cancel"),
    variant = "default",
  } = displayedOptions;

  const handleConfirm = () => {
    handleDialogResult(true);
  };

  const handleCancel = () => {
    handleDialogResult(false);
  };

  return (
    <Dialog open={dialogState.open} onOpenChange={open => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleCancel}>
              {cancelText}
            </Button>
          </DialogClose>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { Sayno };

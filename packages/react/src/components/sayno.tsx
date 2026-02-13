import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangleIcon, HelpCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~react/components/button";
import { handleDialogResult } from "~react/lib/sayno";
import { cn } from "~react/lib/utils";

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

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const;

const contentVariants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 28,
      stiffness: 400,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: {
      duration: 0.15,
      ease: "easeOut" as const,
    },
  },
};

const iconVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -12 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      damping: 20,
      stiffness: 300,
      delay: 0.1,
    },
  },
};

const textVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      delay: 0.12 + i * 0.06,
    },
  }),
};

const buttonContainerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      delay: 0.22,
    },
  },
};

function Sayno() {
  const { t } = useTranslation();

  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    options: {},
    resolve: null,
  });

  const [displayedOptions, setDisplayedOptions] = useState<DialogState["options"]>({});

  useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      const newState = event.detail;
      setDialogState(newState);

      if (newState.open && !dialogState.open) {
        setDisplayedOptions(newState.options);
      }
    };

    window.addEventListener("sayno-update", handleUpdate as EventListener);

    return () => {
      window.removeEventListener("sayno-update", handleUpdate as EventListener);
    };
  }, [dialogState.open]);

  useEffect(() => {
    if (!dialogState.open && dialogState.options !== displayedOptions) {
      const timer = setTimeout(() => {
        setDisplayedOptions(dialogState.options);
      }, 200);

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

  const isDestructive = variant === "destructive";

  const handleConfirm = () => {
    handleDialogResult(true);
  };

  const handleCancel = () => {
    handleDialogResult(false);
  };

  const IconComponent = isDestructive ? AlertTriangleIcon : HelpCircleIcon;

  return (
    <DialogPrimitive.Root open={dialogState.open} onOpenChange={open => !open && handleCancel()}>
      <AnimatePresence>
        {dialogState.open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.2 }}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild>
              <motion.div
                className={cn(
                  "fixed top-1/2 left-1/2 z-50 w-full max-w-100 -translate-x-1/2 -translate-y-1/2",
                  "rounded-xl border bg-background p-6 shadow-2xl shadow-black/10",
                  "focus:outline-none",
                )}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Icon badge */}
                <motion.div
                  className={cn(
                    "mx-auto mb-5 flex size-12 items-center justify-center rounded-full",
                    isDestructive
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/10 text-primary",
                  )}
                  variants={iconVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <IconComponent className="size-6" strokeWidth={1.75} />
                </motion.div>

                {/* Content */}
                <div className="text-center">
                  <motion.div
                    custom={0}
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">
                      {title}
                    </DialogPrimitive.Title>
                  </motion.div>

                  <motion.div
                    custom={1}
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <DialogPrimitive.Description className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {description}
                    </DialogPrimitive.Description>
                  </motion.div>
                </div>

                {/* Actions */}
                <motion.div
                  className="mt-6 flex gap-3"
                  variants={buttonContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <DialogPrimitive.Close asChild>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCancel}
                    >
                      {cancelText}
                    </Button>
                  </DialogPrimitive.Close>

                  <Button
                    variant={isDestructive ? "destructive" : "default"}
                    className="flex-1"
                    onClick={handleConfirm}
                  >
                    {confirmText}
                  </Button>
                </motion.div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

export { Sayno };

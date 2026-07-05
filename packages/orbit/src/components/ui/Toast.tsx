import * as RToast from "@radix-ui/react-toast";
import { forwardRef } from "react";

import { X } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

/**
 * Toast — composable transient notification on Radix (shadcn-style). Mount one
 * `ToastProvider` + `ToastViewport` near the app root, then render `Toast`s with
 * controlled `open`/`onOpenChange`.
 *
 *   <ToastProvider>
 *     <Toast open={open} onOpenChange={setOpen}>
 *       <div className="grid gap-1">
 *         <ToastTitle>Projet créé</ToastTitle>
 *         <ToastDescription>« Refonte » est prêt.</ToastDescription>
 *       </div>
 *       <ToastClose />
 *     </Toast>
 *     <ToastViewport />
 *   </ToastProvider>
 */

export const ToastProvider = RToast.Provider;

type Tone = "default" | "success" | "danger";
const tones: Record<Tone, string> = {
  default: "border-line bg-surface text-ink",
  success: "border-sage/30 bg-sage-soft text-[#15803d]",
  danger: "border-coral/30 bg-coral-soft text-coral-deep",
};

export const ToastViewport = forwardRef<
  React.ElementRef<typeof RToast.Viewport>,
  React.ComponentPropsWithoutRef<typeof RToast.Viewport>
>(({ className, ...props }, ref) => (
  <RToast.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-100 flex max-h-screen w-full flex-col gap-2.5 p-4 sm:max-w-sm",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = RToast.Viewport.displayName;

export const Toast = forwardRef<
  React.ElementRef<typeof RToast.Root>,
  React.ComponentPropsWithoutRef<typeof RToast.Root> & { tone?: Tone }
>(({ className, tone = "default", ...props }, ref) => (
  <RToast.Root
    ref={ref}
    className={cn(
      "group relative flex items-center justify-between gap-3 rounded-xl border p-4 shadow-pop",
      "data-[state=open]:animate-pop-in data-[state=closed]:animate-overlay-out",
      "data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-overlay-out",
      tones[tone],
      className,
    )}
    {...props}
  />
));
Toast.displayName = RToast.Root.displayName;

export const ToastTitle = forwardRef<
  React.ElementRef<typeof RToast.Title>,
  React.ComponentPropsWithoutRef<typeof RToast.Title>
>(({ className, ...props }, ref) => (
  <RToast.Title ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
));
ToastTitle.displayName = RToast.Title.displayName;

export const ToastDescription = forwardRef<
  React.ElementRef<typeof RToast.Description>,
  React.ComponentPropsWithoutRef<typeof RToast.Description>
>(({ className, ...props }, ref) => (
  <RToast.Description ref={ref} className={cn("text-sm opacity-80", className)} {...props} />
));
ToastDescription.displayName = RToast.Description.displayName;

export const ToastAction = forwardRef<
  React.ElementRef<typeof RToast.Action>,
  React.ComponentPropsWithoutRef<typeof RToast.Action>
>(({ className, ...props }, ref) => (
  <RToast.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center rounded-md border border-line bg-surface px-3 text-[13px] font-medium text-ink outline-none transition-colors hover:bg-surface-2 focus-visible:ring-4 focus-visible:ring-accent/15",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = RToast.Action.displayName;

export const ToastClose = forwardRef<
  React.ElementRef<typeof RToast.Close>,
  React.ComponentPropsWithoutRef<typeof RToast.Close>
>(({ className, ...props }, ref) => (
  <RToast.Close
    ref={ref}
    aria-label="Fermer"
    className={cn(
      "grid size-7 shrink-0 place-items-center rounded-md text-current opacity-60 outline-none transition-opacity hover:opacity-100 focus-visible:ring-4 focus-visible:ring-accent/15",
      className,
    )}
    {...props}
  >
    <X className="size-4" />
  </RToast.Close>
));
ToastClose.displayName = RToast.Close.displayName;

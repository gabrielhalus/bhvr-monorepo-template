import * as RDialog from "@radix-ui/react-dialog";
import { forwardRef } from "react";

import { X } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

/**
 * Dialog — composable modal on Radix (shadcn-style).
 *
 *   <Dialog>
 *     <DialogTrigger asChild><Button>Ouvrir</Button></DialogTrigger>
 *     <DialogContent>
 *       <DialogHeader>
 *         <DialogTitle>Nouveau projet</DialogTitle>
 *         <DialogDescription>Renseigne les détails.</DialogDescription>
 *       </DialogHeader>
 *       …
 *       <DialogFooter>
 *         <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
 *         <Button>Créer</Button>
 *       </DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 */

export const Dialog = RDialog.Root;
export const DialogTrigger = RDialog.Trigger;
export const DialogClose = RDialog.Close;

export const DialogOverlay = forwardRef<
  React.ElementRef<typeof RDialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof RDialog.Overlay>
>(({ className, ...props }, ref) => (
  <RDialog.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-ink/40 backdrop-blur-[1px]",
      "data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = RDialog.Overlay.displayName;

export const DialogContent = forwardRef<
  React.ElementRef<typeof RDialog.Content>,
  React.ComponentPropsWithoutRef<typeof RDialog.Content> & { showClose?: boolean }
>(({ className, children, showClose = true, ...props }, ref) => (
  <RDialog.Portal>
    <DialogOverlay />
    <RDialog.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-1/2 gap-5",
        "rounded-xl border border-line bg-surface p-6 shadow-pop",
        "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
        className,
      )}
      {...props}
    >
      {children}
      {showClose && (
        <RDialog.Close
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-md text-muted outline-none transition-colors hover:bg-surface-2 hover:text-ink focus-visible:ring-4 focus-visible:ring-accent/15"
          aria-label="Fermer"
        >
          <X className="size-4" />
        </RDialog.Close>
      )}
    </RDialog.Content>
  </RDialog.Portal>
));
DialogContent.displayName = RDialog.Content.displayName;

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 pr-8", className)} {...props} />;
}
DialogHeader.displayName = "DialogHeader";

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
DialogFooter.displayName = "DialogFooter";

export const DialogTitle = forwardRef<
  React.ElementRef<typeof RDialog.Title>,
  React.ComponentPropsWithoutRef<typeof RDialog.Title>
>(({ className, ...props }, ref) => (
  <RDialog.Title
    ref={ref}
    className={cn("text-lg font-semibold tracking-tight text-ink", className)}
    {...props}
  />
));
DialogTitle.displayName = RDialog.Title.displayName;

export const DialogDescription = forwardRef<
  React.ElementRef<typeof RDialog.Description>,
  React.ComponentPropsWithoutRef<typeof RDialog.Description>
>(({ className, ...props }, ref) => (
  <RDialog.Description ref={ref} className={cn("text-sm text-muted", className)} {...props} />
));
DialogDescription.displayName = RDialog.Description.displayName;

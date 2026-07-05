import type { Button } from "./Button";

import * as RAlert from "@radix-ui/react-alert-dialog";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

import { buttonVariants } from "./Button";

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];

/**
 * AlertDialog — composable confirmation modal on Radix (shadcn-style).
 * Unlike Dialog it is non-dismissible by overlay click and has Action/Cancel.
 *
 *   <AlertDialog>
 *     <AlertDialogTrigger asChild><Button variant="danger">Supprimer</Button></AlertDialogTrigger>
 *     <AlertDialogContent>
 *       <AlertDialogHeader>
 *         <AlertDialogTitle>Supprimer le projet ?</AlertDialogTitle>
 *         <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
 *       </AlertDialogHeader>
 *       <AlertDialogFooter>
 *         <AlertDialogCancel>Annuler</AlertDialogCancel>
 *         <AlertDialogAction variant="danger">Supprimer</AlertDialogAction>
 *       </AlertDialogFooter>
 *     </AlertDialogContent>
 *   </AlertDialog>
 */

export const AlertDialog = RAlert.Root;
export const AlertDialogTrigger = RAlert.Trigger;

export const AlertDialogOverlay = forwardRef<
  React.ElementRef<typeof RAlert.Overlay>,
  React.ComponentPropsWithoutRef<typeof RAlert.Overlay>
>(({ className, ...props }, ref) => (
  <RAlert.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-ink/40 backdrop-blur-[1px]",
      "data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out",
      className,
    )}
    {...props}
  />
));
AlertDialogOverlay.displayName = RAlert.Overlay.displayName;

export const AlertDialogContent = forwardRef<
  React.ElementRef<typeof RAlert.Content>,
  React.ComponentPropsWithoutRef<typeof RAlert.Content>
>(({ className, ...props }, ref) => (
  <RAlert.Portal>
    <AlertDialogOverlay />
    <RAlert.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-full max-w-md -translate-1/2 gap-5",
        "rounded-xl border border-line bg-surface p-6 shadow-pop",
        "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
        className,
      )}
      {...props}
    />
  </RAlert.Portal>
));
AlertDialogContent.displayName = RAlert.Content.displayName;

export function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}
AlertDialogHeader.displayName = "AlertDialogHeader";

export function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
AlertDialogFooter.displayName = "AlertDialogFooter";

export const AlertDialogTitle = forwardRef<
  React.ElementRef<typeof RAlert.Title>,
  React.ComponentPropsWithoutRef<typeof RAlert.Title>
>(({ className, ...props }, ref) => (
  <RAlert.Title
    ref={ref}
    className={cn("text-lg font-semibold tracking-tight text-ink", className)}
    {...props}
  />
));
AlertDialogTitle.displayName = RAlert.Title.displayName;

export const AlertDialogDescription = forwardRef<
  React.ElementRef<typeof RAlert.Description>,
  React.ComponentPropsWithoutRef<typeof RAlert.Description>
>(({ className, ...props }, ref) => (
  <RAlert.Description ref={ref} className={cn("text-sm text-muted", className)} {...props} />
));
AlertDialogDescription.displayName = RAlert.Description.displayName;

export const AlertDialogAction = forwardRef<
  React.ElementRef<typeof RAlert.Action>,
  React.ComponentPropsWithoutRef<typeof RAlert.Action> & { variant?: ButtonVariant }
>(({ className, variant = "primary", ...props }, ref) => (
  <RAlert.Action ref={ref} className={buttonVariants({ variant, className })} {...props} />
));
AlertDialogAction.displayName = RAlert.Action.displayName;

export const AlertDialogCancel = forwardRef<
  React.ElementRef<typeof RAlert.Cancel>,
  React.ComponentPropsWithoutRef<typeof RAlert.Cancel>
>(({ className, ...props }, ref) => (
  <RAlert.Cancel
    ref={ref}
    className={buttonVariants({ variant: "outline", className })}
    {...props}
  />
));
AlertDialogCancel.displayName = RAlert.Cancel.displayName;

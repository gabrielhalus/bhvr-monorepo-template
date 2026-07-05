import type { ReactNode } from "react";

// ============================================================================
// Types
// ============================================================================

type DialogVariant = "default" | "destructive" | "success";

type BaseDialogOptions = {
  title?: string;
  description?: string;
  variant?: DialogVariant;
};

type AlertOptions = BaseDialogOptions & {
  confirmText?: string;
};

type ConfirmOptions = BaseDialogOptions & {
  confirmText?: string;
  cancelText?: string;
};

type PromptOptions = BaseDialogOptions & {
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  inputType?: "text" | "email" | "password" | "number" | "url";
};

type CustomOptions<T = unknown> = BaseDialogOptions & {
  content: ReactNode | ((resolve: (value: T) => void) => ReactNode);
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
};

type DialogMode = "alert" | "confirm" | "prompt" | "custom";

type DialogState<T = unknown> = {
  open: boolean;
  mode: DialogMode;
  options: AlertOptions | ConfirmOptions | PromptOptions | CustomOptions<T>;
  resolve: ((value: T) => void) | null;
};

// ============================================================================
// State Management
// ============================================================================

let resolvePromise: ((value: unknown) => void) | null = null;

function dispatchDialogEvent<T>(state: Partial<DialogState<T>>) {
  window.dispatchEvent(new CustomEvent("sayno-update", { detail: state }));
}

function closeDialog() {
  dispatchDialogEvent({
    open: false,
    mode: "confirm",
    options: {},
    resolve: null,
  });
}

// ============================================================================
// Dialog Result Handler
// ============================================================================

export function handleDialogResult<T = unknown>(value: T) {
  if (resolvePromise) {
    resolvePromise(value);
    resolvePromise = null;
  }
  closeDialog();
}

// ============================================================================
// Dialog API
// ============================================================================

/**
 * Show an alert dialog with a single confirmation button.
 * Returns a promise that resolves when the user acknowledges.
 */
function alert(options: AlertOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    resolvePromise = () => resolve();

    dispatchDialogEvent({
      open: true,
      mode: "alert",
      options,
      resolve: resolvePromise,
    });
  });
}

/**
 * Show a confirmation dialog with confirm/cancel buttons.
 * Returns a promise that resolves to true (confirmed) or false (cancelled).
 */
function confirm(options: ConfirmOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    resolvePromise = resolve as (value: unknown) => void;

    dispatchDialogEvent({
      open: true,
      mode: "confirm",
      options,
      resolve: resolvePromise,
    });
  });
}

/**
 * Show a prompt dialog with an input field.
 * Returns a promise that resolves to the input value, or null if cancelled.
 */
function prompt(options: PromptOptions = {}): Promise<string | null> {
  return new Promise((resolve) => {
    resolvePromise = resolve as (value: unknown) => void;

    dispatchDialogEvent({
      open: true,
      mode: "prompt",
      options,
      resolve: resolvePromise,
    });
  });
}

/**
 * Show a custom dialog with arbitrary content.
 * The content can be a ReactNode or a render function that receives a resolve callback.
 * Returns a promise that resolves to whatever value is passed to handleDialogResult.
 */
function custom<T = unknown>(options: CustomOptions<T>): Promise<T> {
  return new Promise((resolve) => {
    resolvePromise = resolve as (value: unknown) => void;

    dispatchDialogEvent({
      open: true,
      mode: "custom",
      options,
      resolve: resolvePromise,
    });
  });
}

// ============================================================================
// Exports
// ============================================================================

const sayno = {
  alert,
  confirm,
  prompt,
  custom,
};

export default sayno;

export type {
  AlertOptions,
  ConfirmOptions,
  CustomOptions,
  DialogMode,
  DialogState,
  DialogVariant,
  PromptOptions,
};

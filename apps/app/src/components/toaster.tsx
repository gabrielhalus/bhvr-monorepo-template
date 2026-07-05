import type { ToasterProps } from "sonner";

import { Toaster as Sonner } from "sonner";

/**
 * App toaster — sonner styled on Orbit tokens (light-only). The imperative
 * `toast.*` API keeps coming from the `sonner` package directly.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--color-surface)",
          "--normal-text": "var(--color-ink)",
          "--normal-border": "var(--color-line)",
          "--border-radius": "0.625rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "shadow-pop",
        },
      }}
      {...props}
    />
  );
}

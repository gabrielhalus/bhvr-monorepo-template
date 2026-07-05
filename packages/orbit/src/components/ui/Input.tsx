import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

const fieldBase
  = "w-full rounded-lg bg-surface border border-line px-3.5 text-sm text-ink placeholder:text-faint transition-all duration-150 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-50";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      fieldBase,
      "h-11",
      invalid && "border-coral focus:border-coral focus:ring-coral/30",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "min-h-24 resize-y py-3 leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-[13px] font-medium text-ink"
        >
          {label}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}

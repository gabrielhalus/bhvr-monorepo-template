import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/** Form label primitive — pair with any control via `htmlFor`. */
export const Label = forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-[13px] font-medium text-ink select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

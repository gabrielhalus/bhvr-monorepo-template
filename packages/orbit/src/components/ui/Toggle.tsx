import * as RCheckbox from "@radix-ui/react-checkbox";
import * as RRadio from "@radix-ui/react-radio-group";
import * as RSwitch from "@radix-ui/react-switch";
import { forwardRef, useId } from "react";

import { Check } from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

/* ---------------- Switch (Radix) ---------------- */

export function Switch({
  checked,
  defaultChecked,
  onChange,
  label,
  disabled,
  id,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className="inline-flex items-center gap-2.5">
      <RSwitch.Root
        id={fieldId}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onChange}
        disabled={disabled}
        className={cn(
          "relative h-6 w-11 rounded-pill border border-transparent outline-none transition-colors duration-200",
          "bg-line-strong hover:bg-faint/70 data-[state=checked]:bg-accent data-[state=checked]:hover:bg-accent-deep",
          "focus-visible:ring-4 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        <RSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-sm ring-1 ring-ink/5 transition-transform duration-200 ease-spring data-[state=checked]:translate-x-5" />
      </RSwitch.Root>
      {label && (
        <label htmlFor={fieldId} className="cursor-pointer text-sm text-ink">
          {label}
        </label>
      )}
    </div>
  );
}

/* ---------------- Checkbox (Radix) ---------------- */

export function Checkbox({
  checked,
  defaultChecked,
  onChange,
  label,
  disabled,
  id,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className="inline-flex items-center gap-2.5">
      <RCheckbox.Root
        id={fieldId}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={v => onChange?.(v === true)}
        disabled={disabled}
        className={cn(
          "grid size-5 place-items-center rounded-md border outline-none transition-all duration-150",
          "border-line-strong bg-surface hover:border-faint",
          "data-[state=checked]:border-accent data-[state=checked]:bg-accent",
          "focus-visible:ring-4 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        <RCheckbox.Indicator>
          <Check className="size-3.5 text-white" strokeWidth={3} />
        </RCheckbox.Indicator>
      </RCheckbox.Root>
      {label && (
        <label htmlFor={fieldId} className="cursor-pointer text-sm text-ink">
          {label}
        </label>
      )}
    </div>
  );
}

/* ---------------- Radio group (Radix) ---------------- */

/**
 * RadioGroup — composable (shadcn-style). Pair each item with a `Label`:
 *
 *   <RadioGroup defaultValue="md">
 *     <div className="flex items-center gap-2.5">
 *       <RadioGroupItem value="md" id="r-md" /><Label htmlFor="r-md">Medium</Label>
 *     </div>
 *   </RadioGroup>
 */
export const RadioGroup = forwardRef<
  React.ElementRef<typeof RRadio.Root>,
  React.ComponentPropsWithoutRef<typeof RRadio.Root>
>(({ className, ...props }, ref) => (
  <RRadio.Root
    ref={ref}
    className={cn(
      "flex gap-5 data-[orientation=vertical]:flex-col data-[orientation=vertical]:gap-3",
      className,
    )}
    {...props}
  />
));
RadioGroup.displayName = RRadio.Root.displayName;

export const RadioGroupItem = forwardRef<
  React.ElementRef<typeof RRadio.Item>,
  React.ComponentPropsWithoutRef<typeof RRadio.Item>
>(({ className, ...props }, ref) => (
  <RRadio.Item
    ref={ref}
    className={cn(
      "grid size-5 place-items-center rounded-full border outline-none transition-all duration-150",
      "border-line-strong hover:border-faint data-[state=checked]:border-accent",
      "focus-visible:ring-4 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <RRadio.Indicator className="size-2.5 rounded-full bg-accent" />
  </RRadio.Item>
));
RadioGroupItem.displayName = RRadio.Item.displayName;

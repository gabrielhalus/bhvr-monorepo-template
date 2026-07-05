import * as RSlider from "@radix-ui/react-slider";
import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/**
 * Slider — range input on Radix. Renders a thumb per value in `value`/`defaultValue`.
 *
 *   <Slider defaultValue={[40]} max={100} step={1} />
 *   <Slider defaultValue={[20, 80]} max={100} />   // range
 */
export const Slider = forwardRef<
  React.ElementRef<typeof RSlider.Root>,
  React.ComponentPropsWithoutRef<typeof RSlider.Root>
>(({ className, defaultValue, value, ...props }, ref) => {
  const count = (value ?? defaultValue ?? [0]).length;
  return (
    <RSlider.Root
      ref={ref}
      defaultValue={defaultValue}
      value={value}
      className={cn(
        "relative flex w-full touch-none select-none items-center data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RSlider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-pill bg-paper-2">
        <RSlider.Range className="absolute h-full rounded-pill bg-accent" />
      </RSlider.Track>
      {Array.from({ length: count }, (_, i) => (
        <RSlider.Thumb
          key={i}
          className="block size-4 rounded-full border-2 border-accent bg-surface shadow-soft outline-none transition-colors hover:bg-accent-soft focus-visible:ring-4 focus-visible:ring-accent/25 disabled:pointer-events-none"
        />
      ))}
    </RSlider.Root>
  );
});
Slider.displayName = RSlider.Root.displayName;

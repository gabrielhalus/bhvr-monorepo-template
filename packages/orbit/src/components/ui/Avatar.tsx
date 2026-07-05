import * as RAvatar from "@radix-ui/react-avatar";

import { cn, initials } from "~orbit/lib/utils";

type Size = "xs" | "sm" | "md" | "lg";

const sizeMap: Record<Size, string> = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

const palettes = [
  "bg-accent-soft text-[#5a3ee0]",
  "bg-amber-soft text-[#b45309]",
  "bg-coral-soft text-[#c0383c]",
  "bg-sage-soft text-[#15803d]",
  "bg-sky-soft text-[#2f5fd0]",
];

function hashIndex(s: string, mod: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
  return h % mod;
}

/** Avatar with image + initials fallback, built on Radix Avatar. */
export function Avatar({
  name,
  src,
  size = "md",
  ring = false,
  className,
}: {
  name: string;
  src?: string;
  size?: Size;
  ring?: boolean;
  className?: string;
}) {
  const palette = palettes[hashIndex(name, palettes.length)];
  return (
    <RAvatar.Root
      title={name}
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full align-middle font-semibold",
        sizeMap[size],
        ring && "ring-2 ring-surface",
        className,
      )}
    >
      {src && (
        <RAvatar.Image
          src={src}
          alt={name}
          className="size-full object-cover"
        />
      )}
      <RAvatar.Fallback
        delayMs={src ? 300 : 0}
        className={cn("grid size-full place-items-center", palette)}
      >
        {initials(name)}
      </RAvatar.Fallback>
    </RAvatar.Root>
  );
}

export function AvatarGroup({
  names,
  size = "sm",
  max = 4,
}: {
  names: string[];
  size?: Size;
  max?: number;
}) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div className="flex items-center -space-x-2.5">
      {shown.map(n => (
        <Avatar key={n} name={n} size={size} ring />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            "relative z-10 grid shrink-0 place-items-center rounded-full bg-ink font-mono text-paper ring-2 ring-surface",
            sizeMap[size],
          )}
        >
          +
          {extra}
        </span>
      )}
    </div>
  );
}

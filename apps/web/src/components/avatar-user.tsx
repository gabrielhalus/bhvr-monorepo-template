import type { VariantProps } from "class-variance-authority";

import { cva } from "class-variance-authority";

import { generateAvatarFallback } from "@/helpers/generate-avatar-fallback";
import { Avatar, AvatarFallback, AvatarImage } from "@bunstack/react/components/avatar";
import { cn } from "@bunstack/react/lib/utils";

type AvatarUserProps = {
  avatar: string | null;
  name: string;
};

const avatarVariants = cva(
  "rounded-lg bg-secondary text-secondary-foreground",
  {
    variants: {
      size: {
        default: "size-8",
        sm: "size-6",
        lg: "size-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export function AvatarUser({ avatar, name, size }: AvatarUserProps & VariantProps<typeof avatarVariants>) {
  const avatarFallback = generateAvatarFallback(name);

  return (
    <Avatar className={avatarVariants({ size })}>
      {avatar ? <AvatarImage src={avatar} className="object-cover" /> : null}
      <AvatarFallback className={cn(avatarVariants({ size }))}>{avatarFallback}</AvatarFallback>
    </Avatar>
  );
}

import type { VariantProps } from "class-variance-authority";

import { cva } from "class-variance-authority";

import { generateAvatarFallback } from "@/helpers/generate-avatar-fallback";
import { formatFullName } from "~react/lib/name-utils";
import { Avatar, AvatarFallback, AvatarImage } from "~react/components/avatar";
import { cn } from "~react/lib/utils";

type AvatarUserProps = {
  avatar: string | null;
  firstName: string;
  lastName: string;
};

const avatarVariants = cva(
  "rounded-lg bg-secondary text-secondary-foreground",
  {
    variants: {
      size: {
        default: "size-8",
        sm: "size-6 text-xs",
        lg: "size-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export function AvatarUser({ avatar, firstName, lastName, size }: AvatarUserProps & VariantProps<typeof avatarVariants>) {
  const fullName = formatFullName(firstName, lastName);
  const avatarFallback = generateAvatarFallback(fullName);

  return (
    <Avatar className={avatarVariants({ size })}>
      {avatar ? <AvatarImage src={avatar} className="object-cover" /> : null}
      <AvatarFallback className={cn(avatarVariants({ size }))}>{avatarFallback}</AvatarFallback>
    </Avatar>
  );
}

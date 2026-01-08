import type { ConfigNode } from "@bunstack/shared/types/db/runtime-configs.types";

import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, buttonVariants } from "~react/components/button";
import { cn } from "~react/lib/utils";

export function ConfigSection({ node, depth = 0 }: { node: ConfigNode; depth?: number }) {
  const { t } = useTranslation("web");
  const [isExpanded, setIsExpanded] = useState(depth === 0);

  if (node.isLeaf) {
    return null;
  }

  const hasNonLeafChildren = Array.from(node.children.values()).some(child => !child.isLeaf);

  if (!hasNonLeafChildren) {
    const pathParts = node.fullKey.split(".");
    return (
      <Link to="/settings/$" params={{ _splat: pathParts.join("/") }} className={cn(buttonVariants({ variant: "ghost" }), "justify-start")} activeProps={{ className: cn(buttonVariants(), "justify-start") }}>
        {t(`pages.settings.config.section.${node.fullKey}.label`)}
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <Button variant="ghost" className="w-full justify-start" onClick={() => setIsExpanded(!isExpanded)}>
        <ChevronRightIcon className={cn("size-4 transition-transform", isExpanded && "rotate-90")} />
        {t(`pages.settings.config.section.${node.fullKey}.label`)}
      </Button>

      {isExpanded && (
        <div className="ml-4 space-y-1 border-l pl-2">
          {Array.from(node.children.values()).map(child => (
            <ConfigSection key={child.fullKey} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

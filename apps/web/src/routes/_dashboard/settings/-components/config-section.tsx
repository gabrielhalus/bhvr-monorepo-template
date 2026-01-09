import type { ConfigNode } from "@bunstack/shared/types/db/runtime-configs.types";

import { Link, useMatchRoute } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, buttonVariants } from "~react/components/button";
import { cn } from "~react/lib/utils";

export function ConfigSection({ node, depth = 0 }: { node: ConfigNode; depth?: number }) {
  const { t } = useTranslation("web");
  const [isExpanded, setIsExpanded] = useState(depth === 0);

  const matchRoute = useMatchRoute();
  const pathParts = node.fullKey.split(".");

  const isActive = matchRoute({
    to: "/settings/$",
    params: { _splat: pathParts.join("/") },
  });

  if (node.isLeaf) {
    return null;
  }

  const hasNonLeafChildren = Array.from(node.children.values()).some(child => !child.isLeaf);

  if (!hasNonLeafChildren) {
    const pathParts = node.fullKey.split(".");
    return (
      <Link
        to="/settings/$"
        params={{ _splat: pathParts.join("/") }}
        className={cn(buttonVariants({ variant: isActive ? "default" : "ghost", size: "sm" }), "w-full justify-start")}
      >
        {t(`pages.settings.config.section.${node.fullKey}.label`)}
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setIsExpanded(!isExpanded)}>
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

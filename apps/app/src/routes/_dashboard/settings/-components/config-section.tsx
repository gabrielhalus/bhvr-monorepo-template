import type { ConfigNode } from "~shared/types/db/configs.types";

import { Link, useMatchRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Bell,
  ChevronRight,
  FileText,
  Flag,
  KeyRound,
  Palette,
  ScrollText,
  Settings2,
  ShieldCheck,
  ShoppingCart,
} from "~orbit/components/ui/icons";
import { cn } from "~orbit/lib/utils";

type IconComponent = React.ComponentType<{ className?: string }>;

const SECTION_ICONS: Record<string, IconComponent> = {
  security: ShieldCheck,
  authentication: KeyRound,
  features: Flag,
  branding: Palette,
  orders: ShoppingCart,
  notifications: Bell,
  invoices: FileText,
  documents: ScrollText,
};

function getSectionIcon(fullKey: string): IconComponent {
  const topKey = fullKey.split(".")[0];
  return (topKey ? SECTION_ICONS[topKey] : undefined) ?? Settings2;
}

function hasOverriddenDescendant(node: ConfigNode): boolean {
  if (node.config?.isOverridden) return true;
  for (const child of node.children.values()) {
    if (hasOverriddenDescendant(child)) return true;
  }
  return false;
}

export function ConfigSection({ node, depth = 0 }: { node: ConfigNode; depth?: number }) {
  const { t } = useTranslation("web", { keyPrefix: "settings.config" });
  const [isExpanded, setIsExpanded] = useState(depth === 0);

  const matchRoute = useMatchRoute();
  const pathParts = node.fullKey.split(".");

  const isActive = matchRoute({
    to: "/settings/$",
    params: { _splat: pathParts.join("/") },
  });

  const hasModified = hasOverriddenDescendant(node);
  const Icon = depth === 0 ? getSectionIcon(node.fullKey) : null;
  const itemLabel = t(`${node.fullKey}.label` as never);

  if (node.isLeaf) {
    return null;
  }

  const hasNonLeafChildren = Array.from(node.children.values()).some(child => !child.isLeaf);
  const hasLeafChildren = Array.from(node.children.values()).some(child => child.isLeaf);

  const itemBase = cn(
    "group relative flex w-full items-center gap-2.5 rounded-md text-left transition-colors",
    depth === 0 ? "px-2.5 py-2" : "px-2 py-1 text-[13px]",
    isActive
      ? depth === 0
        ? "bg-surface-2"
        : "text-ink"
      : depth === 0
        ? "hover:bg-surface-2/60"
        : "text-muted hover:text-ink",
  );

  // Faithful to settings.html `.cfg-icon` (28px square, inverts to ink when active).
  const iconEl = Icon && (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md transition-all [&_svg]:size-3.5",
        isActive ? "bg-ink text-white" : "bg-surface-2 text-muted",
      )}
    >
      <Icon />
    </span>
  );

  const activeBar = isActive && depth === 0 && (
    <span className="absolute inset-y-2 left-0 w-[2.5px] rounded-full bg-accent" />
  );

  const labelCls = cn(
    "flex-1 truncate",
    depth === 0
      ? isActive ? "text-[13px] font-semibold text-ink" : "text-[13px] font-medium text-muted"
      : isActive ? "font-medium" : "",
  );

  const expandedChildren = (
    <div className="mt-0.5 ml-4 pl-2 border-l border-line/60 flex flex-col gap-0.5">
      {Array.from(node.children.values()).map(child => (
        <ConfigSection key={child.fullKey} node={child} depth={depth + 1} />
      ))}
    </div>
  );

  const dot = <span className="size-1.5 shrink-0 rounded-full bg-amber ring-2 ring-amber/15" aria-label="Modified" />;

  // All leaf children → simple link (no chevron)
  if (!hasNonLeafChildren) {
    return (
      <Link
        to="/settings/$"
        params={{ _splat: pathParts.join("/") }}
        className={itemBase}
      >
        {activeBar}
        {iconEl}
        <span className={labelCls}>{itemLabel}</span>
        {hasModified && dot}
      </Link>
    );
  }

  // Mixed: leaf + non-leaf children → link + expand chevron
  if (hasLeafChildren) {
    return (
      <div>
        <div className="flex items-center gap-0.5">
          <Link
            to="/settings/$"
            params={{ _splat: pathParts.join("/") }}
            className={cn(itemBase, "min-w-0 flex-1")}
          >
            {activeBar}
            {iconEl}
            <span className={labelCls}>{itemLabel}</span>
            {hasModified && !isExpanded && dot}
          </Link>
          <button
            type="button"
            onClick={() => setIsExpanded(v => !v)}
            className="flex size-6 shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-surface-2/60 hover:text-ink"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronRight className={cn("size-3 transition-transform", isExpanded && "rotate-90")} />
          </button>
        </div>
        {isExpanded && expandedChildren}
      </div>
    );
  }

  // Only non-leaf children → expander button (no link)
  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(itemBase, "w-full")}
      >
        {activeBar}
        {iconEl}
        <span className={labelCls}>{itemLabel}</span>
        {hasModified && !isExpanded && dot}
        <ChevronRight className={cn("size-3 shrink-0 text-faint transition-transform", isExpanded && "rotate-90")} />
      </button>
      {isExpanded && expandedChildren}
    </div>
  );
}

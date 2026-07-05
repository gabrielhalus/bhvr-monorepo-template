import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { configsQueryOptions } from "@/api/configs/configs.queries";
import { useBranding } from "@/hooks/use-branding";
import { buildConfigTree } from "~shared/helpers/config-tree";

import { ConfigSection } from "./config-section";

export function Sidebar() {
  const { t } = useTranslation("web");
  const branding = useBranding();
  const { data: { configs } } = useSuspenseQuery(configsQueryOptions);

  const configTree = useMemo(() => {
    if (!configs) {
      return new Map();
    }
    return buildConfigTree(configs);
  }, [configs]);

  return (
    <aside className="self-start overflow-hidden rounded-xl border border-line bg-surface shadow-soft lg:sticky lg:top-18">
      <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          {t("settings.sectionsLabel")}
        </span>
        <span className="rounded bg-ink px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-white">
          {import.meta.env.PROD ? "prod" : "dev"}
        </span>
      </div>
      <nav className="flex flex-col gap-px p-1.5">
        {Array.from(configTree.values()).map(node => (
          <ConfigSection key={node.fullKey} node={node} />
        ))}
      </nav>
      <div className="border-t border-line bg-surface-2/40 px-4 py-3 text-[11px] text-muted">
        {branding.appName}
      </div>
    </aside>
  );
}

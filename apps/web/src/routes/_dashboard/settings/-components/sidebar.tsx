import { getRouteApi } from "@tanstack/react-router";
import { useMemo } from "react";

import { buildConfigTree } from "~shared/helpers/config-tree";

import { ConfigSection } from "./config-section";

const settingsRoute = getRouteApi("/_dashboard/settings");

export function Sidebar() {
  const { configs } = settingsRoute.useLoaderData();

  const configTree = useMemo(() => {
    if (!configs) {
      return new Map();
    }
    return buildConfigTree(configs);
  }, [configs]);

  return (
    <aside className="w-52 shrink-0 pr-4 border-r">
      <div className="flex flex-col gap-0.5">
        {Array.from(configTree.values()).map(node => (
          <ConfigSection key={node.fullKey} node={node} />
        ))}
      </div>
    </aside>
  );
}

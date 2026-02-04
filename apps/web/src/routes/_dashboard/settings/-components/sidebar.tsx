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
    <aside className="h-full w-75 p-2 border-r">
      <div className="flex p-2 flex-col space-y-1">
        {Array.from(configTree.values()).map(node => (
          <ConfigSection key={node.fullKey} node={node} />
        ))}
      </div>
    </aside>
  );
}

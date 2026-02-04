import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { runtimeConfigsQueryOptions } from "@/api/runtime-configs/runtime-configs.queries";
import { buildConfigTree } from "~shared/helpers/config-tree";

import { ConfigSection } from "./config-section";

export function Sidebar() {
  const { data } = useQuery(runtimeConfigsQueryOptions);

  const configTree = useMemo(() => {
    if (!data?.configs) {
      return new Map();
    }
    return buildConfigTree(data.configs);
  }, [data?.configs]);

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

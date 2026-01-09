import type { ConfigNode } from "~shared/types/db/runtime-configs.types";

import { NodeForm } from "./node-form";

type RuntimeConfig = ConfigNode["config"];

export default function NodeView({ node, allConfigs }: { node: ConfigNode; allConfigs: RuntimeConfig[] }) {
  return (
    <div>
      {Array.from(node.children.values()).map(child => (
        <NodeForm node={child} allConfigs={allConfigs} key={child.fullKey} />
      ))}
    </div>
  );
}

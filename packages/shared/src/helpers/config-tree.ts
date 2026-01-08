import type { ConfigNode } from "~shared/types/db/runtime-configs.types";

export function buildConfigTree(configs: any[]): Map<string, ConfigNode> {
  const root = new Map<string, ConfigNode>();

  configs.forEach((config) => {
    const parts = config.configKey.split(".");
    let currentLevel = root;

    parts.forEach((part: string, index: number) => {
      const isLeaf = index === parts.length - 1;
      const fullKey = parts.slice(0, index + 1).join(".");

      if (!currentLevel.has(part)) {
        currentLevel.set(part, {
          key: part,
          fullKey,
          isLeaf,
          children: new Map(),
          config: isLeaf ? config : undefined,
        });
      }

      const node = currentLevel.get(part)!;
      if (isLeaf) {
        node.config = config;
        node.isLeaf = true;
      }

      currentLevel = node.children;
    });
  });

  return root;
}

export function findFirstLeafSection(tree: Map<string, ConfigNode>): string | null {
  for (const node of tree.values()) {
    if (node.isLeaf) {
      continue; // Skip actual leaves, we want sections
    }

    // Check if all children are leaves (this is a section we can link to)
    const hasNonLeafChildren = Array.from(node.children.values()).some(
      child => !child.isLeaf,
    );

    if (!hasNonLeafChildren) {
      // This section has only leaf children, return it
      return node.fullKey.split(".").join("/");
    }

    // Otherwise, recursively search in children
    const childResult = findFirstLeafSection(node.children);
    if (childResult) {
      return childResult;
    }
  }

  return null;
}

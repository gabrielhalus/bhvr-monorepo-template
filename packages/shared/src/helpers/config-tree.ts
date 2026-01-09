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
      continue;
    }

    const hasNonLeafChildren = Array.from(node.children.values()).some(
      child => !child.isLeaf,
    );

    if (!hasNonLeafChildren) {
      return node.fullKey.split(".").join("/");
    }

    const childResult = findFirstLeafSection(node.children);
    if (childResult) {
      return childResult;
    }
  }

  return null;
}

export function findNodeBySegments(root: Map<string, ConfigNode>, segments: readonly string[]): ConfigNode | null {
  let current: ConfigNode | undefined;

  for (const segment of segments) {
    if (!current) {
      current = root.get(segment);
    } else {
      current = current.children?.get(segment);
    }

    if (!current)
      return null;
  }

  return current ?? null;
}

import type { ConfigNode } from "~shared/types/db/runtime-configs.types";

function getOrCreate(map: Map<string, ConfigNode>, part: string, fullKey: string, isLeaf: boolean): ConfigNode {
  if (!map.has(part)) {
    map.set(part, { key: part, fullKey, isLeaf, children: new Map() });
  }
  return map.get(part)!;
}

function sortByOrder(map: Map<string, ConfigNode>): Map<string, ConfigNode> {
  const sorted = new Map(
    Array.from(map.entries()).sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0)),
  );
  for (const node of sorted.values()) {
    if (node.children.size > 0) {
      node.children = sortByOrder(node.children);
    }
  }
  return sorted;
}

export function buildConfigTree(configs: any[]): Map<string, ConfigNode> {
  const root = new Map<string, ConfigNode>();

  const nodeEntries = configs.filter(c => c.type === "node");
  const leafEntries = configs.filter(c => c.type !== "node");

  // Apply node orders first so they're available when building the tree
  nodeEntries.forEach((config) => {
    const parts = config.configKey.split(".");
    let currentLevel = root;

    parts.forEach((part: string, index: number) => {
      const isLast = index === parts.length - 1;
      const fullKey = parts.slice(0, index + 1).join(".");
      const node = getOrCreate(currentLevel, part, fullKey, false);
      if (isLast) {
        node.order = config.order;
      }
      currentLevel = node.children;
    });
  });

  // Build leaf entries into the tree
  leafEntries.forEach((config) => {
    const parts = config.configKey.split(".");
    let currentLevel = root;

    parts.forEach((part: string, index: number) => {
      const isLeaf = index === parts.length - 1;
      const fullKey = parts.slice(0, index + 1).join(".");
      const node = getOrCreate(currentLevel, part, fullKey, isLeaf);
      if (isLeaf) {
        node.config = config;
        node.isLeaf = true;
      }
      currentLevel = node.children;
    });
  });

  return sortByOrder(root);
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

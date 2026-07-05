import { describe, expect, it } from "bun:test";

import { buildConfigTree, findFirstLeafSection, findNodeBySegments } from "~shared/helpers/config-tree";

function leaf(configKey: string, extra: Record<string, unknown> = {}) {
  return { configKey, type: "string", ...extra };
}

function node(configKey: string, order?: number) {
  return { configKey, type: "node", order };
}

// ── buildConfigTree ──────────────────────────────────────────────────────────

describe("buildConfigTree", () => {
  it("returns an empty map for an empty config list", () => {
    const tree = buildConfigTree([]);
    expect(tree.size).toBe(0);
  });

  it("builds a flat tree for single-segment keys", () => {
    const configs = [leaf("theme"), leaf("language")];
    const tree = buildConfigTree(configs);
    expect(tree.has("theme")).toBe(true);
    expect(tree.has("language")).toBe(true);
    expect(tree.get("theme")!.isLeaf).toBe(true);
    expect(tree.get("language")!.isLeaf).toBe(true);
  });

  it("sets fullKey correctly for single-segment keys", () => {
    const tree = buildConfigTree([leaf("theme")]);
    expect(tree.get("theme")!.fullKey).toBe("theme");
  });

  it("builds a nested tree for dot-separated keys", () => {
    const tree = buildConfigTree([leaf("app.color.primary")]);
    const appNode = tree.get("app");
    expect(appNode).toBeDefined();
    expect(appNode!.isLeaf).toBe(false);
    const colorNode = appNode!.children.get("color");
    expect(colorNode).toBeDefined();
    const primaryNode = colorNode!.children.get("primary");
    expect(primaryNode!.isLeaf).toBe(true);
    expect(primaryNode!.config).toBeDefined();
  });

  it("sets fullKey correctly for nested keys", () => {
    const tree = buildConfigTree([leaf("app.color.primary")]);
    const appNode = tree.get("app")!;
    expect(appNode.fullKey).toBe("app");
    expect(appNode.children.get("color")!.fullKey).toBe("app.color");
    expect(appNode.children.get("color")!.children.get("primary")!.fullKey).toBe("app.color.primary");
  });

  it("assigns order from node-type entries", () => {
    const configs = [node("security", 2), node("appearance", 1)];
    const tree = buildConfigTree(configs);
    // sorted by order: appearance (1) first, security (2) second
    const keys = Array.from(tree.keys());
    expect(keys[0]).toBe("appearance");
    expect(keys[1]).toBe("security");
  });

  it("attaches config to leaf nodes", () => {
    const config = leaf("theme");
    const tree = buildConfigTree([config]);
    expect(tree.get("theme")!.config).toEqual(config);
  });

  it("handles multiple sibling leaves", () => {
    const configs = [leaf("app.name"), leaf("app.version")];
    const tree = buildConfigTree(configs);
    const appNode = tree.get("app")!;
    expect(appNode.children.size).toBe(2);
    expect(appNode.children.get("name")!.isLeaf).toBe(true);
    expect(appNode.children.get("version")!.isLeaf).toBe(true);
  });

  it("handles a mix of node-type and leaf-type configs", () => {
    const configs = [
      node("security", 1),
      leaf("security.jwt.secret"),
    ];
    const tree = buildConfigTree(configs);
    expect(tree.get("security")!.order).toBe(1);
    const jwtNode = tree.get("security")!.children.get("jwt");
    expect(jwtNode).toBeDefined();
    expect(jwtNode!.children.get("secret")!.isLeaf).toBe(true);
  });
});

// ── findFirstLeafSection ─────────────────────────────────────────────────────

describe("findFirstLeafSection", () => {
  it("returns null for an empty tree", () => {
    expect(findFirstLeafSection(new Map())).toBeNull();
  });

  it("returns null when all top-level nodes are leaves", () => {
    const tree = buildConfigTree([leaf("name"), leaf("version")]);
    expect(findFirstLeafSection(tree)).toBeNull();
  });

  it("returns the section key when all children are leaves", () => {
    const tree = buildConfigTree([leaf("app.name"), leaf("app.version")]);
    // "app" is a section whose children are all leaves
    expect(findFirstLeafSection(tree)).toBe("app");
  });

  it("recursively finds the deepest all-leaf section", () => {
    // "security.jwt" has only leaves; "security" has a non-leaf child (jwt)
    const tree = buildConfigTree([leaf("security.jwt.secret"), leaf("security.jwt.expiry")]);
    expect(findFirstLeafSection(tree)).toBe("security/jwt");
  });

  it("uses '/' as separator in the returned path", () => {
    const tree = buildConfigTree([leaf("a.b.key")]);
    expect(findFirstLeafSection(tree)).toBe("a/b");
  });
});

// ── findNodeBySegments ───────────────────────────────────────────────────────

describe("findNodeBySegments", () => {
  const tree = buildConfigTree([leaf("app.color.primary"), leaf("app.color.secondary"), leaf("security.jwt.secret")]);

  it("returns null for empty segments", () => {
    expect(findNodeBySegments(tree, [])).toBeNull();
  });

  it("finds a top-level node", () => {
    const node = findNodeBySegments(tree, ["app"]);
    expect(node).not.toBeNull();
    expect(node!.key).toBe("app");
  });

  it("finds a nested node", () => {
    const node = findNodeBySegments(tree, ["app", "color"]);
    expect(node).not.toBeNull();
    expect(node!.fullKey).toBe("app.color");
  });

  it("finds a leaf node", () => {
    const node = findNodeBySegments(tree, ["app", "color", "primary"]);
    expect(node).not.toBeNull();
    expect(node!.isLeaf).toBe(true);
  });

  it("returns null for a non-existent path", () => {
    expect(findNodeBySegments(tree, ["app", "nonexistent"])).toBeNull();
  });

  it("returns null when the first segment does not exist", () => {
    expect(findNodeBySegments(tree, ["missing"])).toBeNull();
  });

  it("returns null for a partially valid path that ends early", () => {
    expect(findNodeBySegments(tree, ["app", "color", "primary", "too", "deep"])).toBeNull();
  });
});

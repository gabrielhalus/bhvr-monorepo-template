import { createFileRoute, getRouteApi, Navigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { buildConfigTree, findFirstLeafSection, findNodeBySegments } from "~shared/helpers/config-tree";

import { NodeForm } from "./-components/node-form";

const settingsRoute = getRouteApi("/_dashboard/settings");

export const Route = createFileRoute("/_dashboard/settings/$")(
  {
    component: RouteComponent,
    loader: ({ params }) => {
      const { _splat: splat } = params;
      if (splat) {
        const segments = splat.split("/");
        return { crumb: [`pages.settings.config.${segments.join(".")}.label`, `pages.settings.config.${segments.join(".")}.label`] };
      }
    },
  },
);

function RouteComponent() {
  const { _splat: splat } = Route.useParams();
  const { configs } = settingsRoute.useLoaderData();

  const segments = splat?.split("/").filter(Boolean) ?? [];

  const configTree = useMemo(() => {
    if (!configs) {
      return null;
    }
    return buildConfigTree(configs);
  }, [configs]);

  if (!splat && configTree) {
    const firstLeafSection = findFirstLeafSection(configTree);

    if (firstLeafSection) {
      return <Navigate to="/settings/$" params={{ _splat: firstLeafSection }} replace />;
    }
  }

  if (!configTree || !segments.length) {
    return null;
  }

  const node = findNodeBySegments(configTree, segments);

  if (!node) {
    return null;
  }

  return (
    <div>
      {Array.from(node.children.values()).map(child => (
        <NodeForm node={child} allConfigs={configs ?? []} key={child.fullKey} />
      ))}
    </div>
  );
}

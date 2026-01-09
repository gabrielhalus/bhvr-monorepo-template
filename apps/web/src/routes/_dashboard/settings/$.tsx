import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { getRuntimeConfigsQueryOptions } from "@/queries/runtime-configs";
import { buildConfigTree, findFirstLeafSection, findNodeBySegments } from "~shared/helpers/config-tree";

import NodeView from "./-components/node-view";

export const Route = createFileRoute("/_dashboard/settings/$")(
  {
    component: RouteComponent,
    loader: ({ params }) => {
      const { _splat: splat } = params;
      if (splat) {
        const segments = splat.split("/");
        return { crumb: [`pages.settings.config.section.${segments.join(".")}.label`, `pages.settings.config.section.${segments.join(".")}.label`] };
      }
    },
  },
);

function RouteComponent() {
  const { _splat: splat } = Route.useParams();
  const { data } = useQuery(getRuntimeConfigsQueryOptions);

  const segments = splat?.split("/").filter(Boolean) ?? [];

  const configTree = useMemo(() => {
    if (!data?.configs) {
      return null;
    }
    return buildConfigTree(data.configs);
  }, [data?.configs]);

  if (!splat && configTree) {
    const firstLeafSection = findFirstLeafSection(configTree);

    if (firstLeafSection) {
      return <Navigate to="/settings/$" params={{ _splat: firstLeafSection }} replace />;
    }
  }

  if (!configTree || segments.length === 0) {
    return null;
  }

  const node = findNodeBySegments(configTree, segments);

  if (!node) {
    return null;
  }

  return (
    <NodeView node={node} allConfigs={data?.configs ?? []} />
  );
}

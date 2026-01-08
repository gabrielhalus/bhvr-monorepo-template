import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";

import { getRuntimeConfigsQueryOptions } from "@/queries/runtime-configs";
import { buildConfigTree, findFirstLeafSection } from "~shared/helpers/config-tree";

export const Route = createFileRoute("/_dashboard/settings/$")(
  {
    component: RouteComponent,
    loader: ({ params }) => {
      const { _splat: splat } = params;
      if (splat) {
        const segments = splat.split("/");
        return { crumb: `pages.settings.config.section.${segments.join(".")}.label` };
      }
    },
  },
);

function RouteComponent() {
  const { _splat: splat } = Route.useParams();
  const { data } = useQuery(getRuntimeConfigsQueryOptions);

  const segments = splat?.split("/");

  if (!splat && data?.configs) {
    const configTree = buildConfigTree(data.configs);
    const firstLeafSection = findFirstLeafSection(configTree);

    if (firstLeafSection) {
      return <Navigate to="/settings/$" params={{ _splat: firstLeafSection }} replace />;
    }
  }

  return (
    <div>
      <pre>{JSON.stringify(segments)}</pre>
    </div>
  );
}

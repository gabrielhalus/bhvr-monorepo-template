import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { getUserQueryOptions } from "@/queries/users";

export const Route = createFileRoute("/_dashboard/settings/users/$userId/")({
  component: User,
  loader: async ({ params: { userId }, context: { queryClient } }) => {
    const { user } = await queryClient.ensureQueryData(getUserQueryOptions(userId));
    return { user, crumb: user.name };
  },
});

function User() {
  const { t: _t } = useTranslation("web");

  const { user } = Route.useLoaderData();

  return (
    <div>
      {`Hello ${user.name}`}
    </div>
  );
}

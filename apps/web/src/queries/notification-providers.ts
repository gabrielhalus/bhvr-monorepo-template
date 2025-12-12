import type { PaginationInput } from "@bunstack/shared/contracts/pagination";

import { queryOptions } from "@tanstack/react-query";

import { api } from "@bunstack/react/lib/http";

export function getNotificationProvidersPaginatedQueryOption(props: PaginationInput) {
  return queryOptions({
    queryKey: ["get-notification-providers-paginated", props],
    queryFn: async () => {
      const params = {
        ...props,
        page: String(props.page),
        pageSize: String(props.pageSize),
      };

      const res = await api.notifications.providers.$get({ query: params });

      if (!res.ok) {
        throw new Error("Failed to fetch notification providers");
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

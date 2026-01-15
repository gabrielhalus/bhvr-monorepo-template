import type { InvitationRelationKeys } from "~shared/types/db/invitations.types";

import { queryOptions } from "@tanstack/react-query";

import { api } from "~react/lib/http";

export function getInvitationsQueryOptions(includes?: InvitationRelationKeys) {
  return queryOptions({
    queryKey: ["get-invitations", includes],
    queryFn: async () => {
      const res = await api.invitations.$get({ query: { includes } });

      if (!res.ok) {
        throw new Error("Failed to fetch invitations");
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function validateInvitationQueryOptions(token: string) {
  return queryOptions({
    queryKey: ["validate-invitation", token],
    queryFn: async () => {
      const res = await api.invitations.validate[":token"].$get({ param: { token } });

      if (!res.ok) {
        throw new Error("Failed to validate invitation");
      }

      return res.json();
    },
    staleTime: 1000 * 60,
    retry: false,
  });
}

import { paginatedInvitationsQueryOptions } from "@/api/invitations/invitations.queries";
import { usePaginatedQuery } from "~react/hooks/use-paginated-query";

export function usePaginatedInvitations() {
  return usePaginatedQuery({ ...paginatedInvitationsQueryOptions });
}

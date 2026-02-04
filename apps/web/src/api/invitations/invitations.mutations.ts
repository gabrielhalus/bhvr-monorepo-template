import type { QueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import type { Invitation } from "~shared/types/db/invitations.types";

import { api } from "~react/lib/http";
import type { AcceptInvitationSchema, CreateInvitationSchema } from "~shared/schemas/api/invitations.schemas";

import { invitationsKeys } from "./invitations.keys";

type CreateInvitationData = z.infer<typeof CreateInvitationSchema>;
type AcceptInvitationData = z.infer<typeof AcceptInvitationSchema>;

// ============================================================================
// Mutation Functions
// ============================================================================

async function createInvitation(data: CreateInvitationData) {
  const res = await api.invitations.$post({ json: data });
  const responseData = await res.json();

  if (!res.ok) {
    const errorMessage = "error" in responseData
      ? (typeof responseData.error === "string" ? responseData.error : "Failed to create invitation")
      : "Failed to create invitation";
    throw new Error(errorMessage);
  }

  if (!("success" in responseData) || !responseData.success || !("invitation" in responseData)) {
    throw new Error("Failed to create invitation");
  }

  return responseData;
}

async function revokeInvitation(id: string) {
  const res = await api.invitations[":id{^[a-zA-Z0-9-]{21}$}"].$put({ param: { id } });

  if (!res.ok) {
    throw new Error("Failed to revoke invitation");
  }

  return res.json();
}

async function deleteInvitation(id: string) {
  const res = await api.invitations[":id{^[a-zA-Z0-9-]{21}$}"].$delete({ param: { id } });

  if (!res.ok) {
    throw new Error("Failed to delete invitation");
  }

  return res.json();
}

async function acceptInvitation(data: AcceptInvitationData) {
  const res = await api.invitations.accept.$post({ json: data });
  const responseData = await res.json();

  if (!res.ok || !("success" in responseData) || !responseData.success) {
    const errorMessage = "error" in responseData
      ? (typeof responseData.error === "string" ? responseData.error : "Failed to accept invitation")
      : "Failed to accept invitation";
    throw new Error(errorMessage);
  }

  return responseData;
}

// ============================================================================
// Mutation Options
// ============================================================================

export function createInvitationMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (data: CreateInvitationData) => createInvitation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.paginated });
    },
  };
}

export function revokeInvitationMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.paginated });
    },
  };
}

export function deleteInvitationMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (id: string) => deleteInvitation(id),
    onSuccess: (_data: { success: true; invitation: Invitation }, id: string) => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.paginated });
    },
  };
}

export function acceptInvitationMutationOptions() {
  return {
    mutationFn: (data: AcceptInvitationData) => acceptInvitation(data),
  };
}

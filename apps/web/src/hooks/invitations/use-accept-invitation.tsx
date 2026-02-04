import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { acceptInvitationMutationOptions } from "@/api/invitations/invitations.mutations";

export function useAcceptInvitation() {
  const navigate = useNavigate();
  const options = acceptInvitationMutationOptions();

  return useMutation({
    ...options,
    onSuccess: () => {
      toast.success("Account created successfully!");
      navigate({ to: "/", replace: true });
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to create account");
    },
  });
}

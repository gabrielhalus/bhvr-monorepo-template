import { z } from "zod";

export const AssignRoleMembersSchema = z.object({
  userIds: z.array(z.string()),
});

export const RemoveRoleMembersSchema = z.object({
  userIds: z.array(z.string()),
});

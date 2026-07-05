import type { UpdatePreferencesSchema } from "~shared/schemas/api/auth.schemas";
import type { z } from "zod";

import { api, ApiError } from "@/lib/http";

type UpdatePreferencesData = z.infer<typeof UpdatePreferencesSchema>;

export async function updatePreferences(data: UpdatePreferencesData) {
  const res = await api.auth.preferences.$patch({ json: data });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}

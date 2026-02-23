import type { UpdatePreferencesSchema } from "~shared/schemas/api/auth.schemas";
import type { z } from "zod";

import { api } from "~react/lib/http";

type UpdatePreferencesData = z.infer<typeof UpdatePreferencesSchema>;

export async function updatePreferences(data: UpdatePreferencesData) {
  const res = await api.auth.preferences.$patch({ json: data });

  if (!res.ok) {
    throw new Error("Failed to update preferences");
  }

  return res.json();
}

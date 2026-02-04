import { api } from "~react/lib/http";

export async function fetchRuntimeConfigs() {
  const res = await api.config.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch configurations");
  }

  return res.json();
}

export async function fetchRuntimeConfig(key: string) {
  const res = await api.config[":key"].$get({ param: { key } });

  if (!res.ok) {
    throw new Error(`Failed to fetch configuration "${key}"`);
  }

  return res.json();
}

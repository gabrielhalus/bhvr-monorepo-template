import { api } from "~react/lib/http";

export async function fetchConfigs() {
  const res = await api.config.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch configurations");
  }

  return res.json();
}

export async function fetchConfig(key: string) {
  const res = await api.config[":key"].$get({ param: { key } });

  if (!res.ok) {
    throw new Error(`Failed to fetch configuration "${key}"`);
  }

  return res.json();
}

export async function rotateConfig(key: string) {
  const res = await api.config[":key"].rotate.$post({ param: { key } });

  if (!res.ok) {
    throw new Error(`Failed to rotate configuration "${key}"`);
  }

  return res.json();
}

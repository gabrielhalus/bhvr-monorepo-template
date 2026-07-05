import { api, ApiError } from "@/lib/http";

export async function fetchConfigs() {
  const res = await api.config.$get();

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}

export async function fetchConfig(key: string) {
  const res = await api.config[":key"].$get({ param: { key } });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}

export async function rotateConfig(key: string) {
  const res = await api.config[":key"].rotate.$post({ param: { key } });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}

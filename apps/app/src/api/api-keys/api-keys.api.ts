import { api, ApiError } from "@/lib/http";

export async function fetchUserApiKeys(userId: string) {
  const res = await api.users[":id{[a-zA-Z0-9_-]{21}}"]["api-keys"].$get({
    param: { id: userId },
  });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}

export async function createUserApiKey(userId: string) {
  const res = await api.users[":id{[a-zA-Z0-9_-]{21}}"]["api-keys"].$post({
    param: { id: userId },
  });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}

export async function deleteUserApiKey(userId: string, apiKeyId: string) {
  const res = await api.users[":id{[a-zA-Z0-9_-]{21}}"]["api-keys"][":apiKeyId{[a-zA-Z0-9_-]{21}}"].$delete({
    param: { id: userId, apiKeyId },
  });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}

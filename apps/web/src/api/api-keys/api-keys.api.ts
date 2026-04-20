import { api } from "~react/lib/http";

export async function fetchUserApiKeys(userId: string) {
  const res = await api.users[":id{[a-zA-Z0-9-]{21}}"]["api-keys"].$get({
    param: { id: userId },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user api-keys");
  }

  return res.json();
}

export async function createUserApiKey(userId: string) {
  const res = await api.users[":id{[a-zA-Z0-9-]{21}}"]["api-keys"].$post({
    param: { id: userId },
  });

  if (!res.ok) {
    throw new Error("Failed to create user api-key");
  }

  return res.json();
}

export async function deleteUserApiKey(userId: string, apiKeyId: string) {
  const res = await api.users[":id{[a-zA-Z0-9-]{21}}"]["api-keys"][":apiKeyId{[a-zA-Z0-9-]{21}}"].$delete({
    param: { id: userId, apiKeyId },
  });

  if (!res.ok) {
    throw new Error("Failed to delete user api-key");
  }

  return res.json();
}

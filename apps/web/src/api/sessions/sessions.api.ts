import { api } from "~react/lib/http";

export async function fetchMySessions() {
  const res = await api.auth.sessions.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch sessions");
  }

  return res.json();
}

export async function fetchUserSessions(userId: string) {
  const res = await api.users[":id{^[a-zA-Z0-9-]{21}$}"].sessions.$get({
    param: { id: userId },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user sessions");
  }

  return res.json();
}

export async function revokeSession(tokenId: string) {
  const res = await api.auth.sessions[":tokenId"].$delete({
    param: { tokenId },
  });

  if (!res.ok) {
    throw new Error("Failed to revoke session");
  }

  return res.json();
}

export async function revokeAllMySessions() {
  const res = await api.auth.sessions.$delete();

  if (!res.ok) {
    throw new Error("Failed to revoke sessions");
  }

  return res.json();
}

export async function revokeUserSession(userId: string, tokenId: string) {
  const res = await api.users[":id{^[a-zA-Z0-9-]{21}$}"].sessions[":tokenId"].$delete({
    param: { id: userId, tokenId },
  });

  if (!res.ok) {
    throw new Error("Failed to revoke user session");
  }

  return res.json();
}

export async function revokeAllUserSessions(userId: string) {
  const res = await api.users[":id{^[a-zA-Z0-9-]{21}$}"].sessions.$delete({
    param: { id: userId },
  });

  if (!res.ok) {
    throw new Error("Failed to revoke user sessions");
  }

  return res.json();
}

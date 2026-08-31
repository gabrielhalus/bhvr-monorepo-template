const oauthRootKey = ["oauth"] as const;

export const oauthKeys = {
  all: oauthRootKey,
  providers: [...oauthRootKey, "providers"] as const,
  accounts: [...oauthRootKey, "accounts"] as const,
  pendingLink: (token: string) => [...oauthRootKey, "pendingLink", token] as const,
  pendingSignup: (token: string) => [...oauthRootKey, "pendingSignup", token] as const,
};

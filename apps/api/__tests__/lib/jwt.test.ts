import { beforeEach, describe, expect, it, mock } from "bun:test";

// Mutable ENV object — functions read it at call time, so mutations take effect.
const mockEnv = {
  APP_ENV: "development" as "development" | "production",
  APP_HOST: "localhost" as string | undefined,
  APP_PORT: 3000,
  APP_URL: "http://localhost:3001",
  DATABASE_URL: "postgresql://test@localhost/test",
};

mock.module("varlock/env", () => ({ ENV: mockEnv }));

const mockGetConfig = mock(async (_key: string) => ({ value: "test-jwt-secret-32-chars-minimum!" } as any));

mock.module("~shared/queries/configs.queries", () => ({
  getConfig: mockGetConfig,
}));

import {
  ACCESS_TOKEN_EXPIRATION_SECONDS,
  createAccessToken,
  createRefreshToken,
  createVerificationToken,
  getCookieSettings,
  getJwtSecret,
  REFRESH_TOKEN_EXPIRATION_SECONDS,
  VERIFICATION_TOKEN_EXPIRATION_SECONDS,
  verifyToken,
} from "@/lib/jwt";

describe("getJwtSecret", () => {
  beforeEach(() => {
    mockGetConfig.mockReset();
  });

  it("returns the secret from config", async () => {
    mockGetConfig.mockResolvedValue({ value: "my-secret-key" });
    const secret = await getJwtSecret();
    expect(secret).toBe("my-secret-key");
  });

  it("throws when config value is null", async () => {
    mockGetConfig.mockResolvedValue({ value: null });
    await expect(getJwtSecret()).rejects.toThrow("JWT secret is not configured");
  });

  it("throws when config value is undefined", async () => {
    mockGetConfig.mockResolvedValue(null);
    await expect(getJwtSecret()).rejects.toThrow("JWT secret is not configured");
  });

  it("calls getConfig with the correct key", async () => {
    mockGetConfig.mockResolvedValue({ value: "secret" });
    await getJwtSecret();
    expect(mockGetConfig).toHaveBeenCalledWith("security.jwt.secret");
  });
});

describe("token expiration constants", () => {
  it("ACCESS_TOKEN_EXPIRATION_SECONDS is 15 minutes", () => {
    expect(ACCESS_TOKEN_EXPIRATION_SECONDS).toBe(900);
  });

  it("REFRESH_TOKEN_EXPIRATION_SECONDS is 30 days", () => {
    expect(REFRESH_TOKEN_EXPIRATION_SECONDS).toBe(60 * 60 * 24 * 30);
  });

  it("VERIFICATION_TOKEN_EXPIRATION_SECONDS is 1 day", () => {
    expect(VERIFICATION_TOKEN_EXPIRATION_SECONDS).toBe(60 * 60 * 24);
  });
});

describe("createAccessToken", () => {
  beforeEach(() => {
    mockGetConfig.mockResolvedValue({ value: "test-jwt-secret-32-chars-minimum!" });
  });

  it("creates a token string", async () => {
    const token = await createAccessToken("user_123");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("creates a verifiable access token with correct sub", async () => {
    const token = await createAccessToken("user_abc");
    const payload = await verifyToken(token, "access");
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe("user_abc");
    expect(payload!.ttyp).toBe("access");
    expect(payload!.iss).toBe("bunstack");
  });

  it("includes impersonatorId when provided", async () => {
    const token = await createAccessToken("user_abc", "admin_123");
    const payload = await verifyToken(token, "access");
    expect(payload).not.toBeNull();
    expect((payload as any).impersonatorId).toBe("admin_123");
  });

  it("does not include impersonatorId when not provided", async () => {
    const token = await createAccessToken("user_abc");
    const payload = await verifyToken(token, "access");
    expect((payload as any).impersonatorId).toBeUndefined();
  });

  it("sets iat and exp fields", async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await createAccessToken("user_abc");
    const after = Math.floor(Date.now() / 1000);
    const payload = await verifyToken(token, "access");
    expect(payload!.iat).toBeGreaterThanOrEqual(before);
    expect(payload!.iat).toBeLessThanOrEqual(after);
    expect(payload!.exp).toBe(payload!.iat + ACCESS_TOKEN_EXPIRATION_SECONDS);
  });
});

describe("createRefreshToken", () => {
  beforeEach(() => {
    mockGetConfig.mockResolvedValue({ value: "test-jwt-secret-32-chars-minimum!" });
  });

  it("creates a verifiable refresh token", async () => {
    const token = await createRefreshToken("user_abc", "token-db-id");
    const payload = await verifyToken(token, "refresh");
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe("user_abc");
    expect(payload!.ttyp).toBe("refresh");
    expect(payload!.jti).toBe("token-db-id");
    expect(payload!.iss).toBe("bunstack");
  });

  it("sets exp to 30 days from now", async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await createRefreshToken("user_abc", "jti-1");
    const payload = await verifyToken(token, "refresh");
    expect(payload!.exp).toBeGreaterThanOrEqual(before + REFRESH_TOKEN_EXPIRATION_SECONDS);
  });
});

describe("createVerificationToken", () => {
  beforeEach(() => {
    mockGetConfig.mockResolvedValue({ value: "test-jwt-secret-32-chars-minimum!" });
  });

  it("creates a verifiable verification token", async () => {
    const token = await createVerificationToken("user_abc", "verify-db-id");
    const payload = await verifyToken(token, "verification");
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe("user_abc");
    expect(payload!.ttyp).toBe("verification");
    expect(payload!.jti).toBe("verify-db-id");
    expect(payload!.iss).toBe("bunstack");
  });
});

describe("verifyToken", () => {
  beforeEach(() => {
    mockGetConfig.mockResolvedValue({ value: "test-jwt-secret-32-chars-minimum!" });
  });

  it("returns null when token type does not match", async () => {
    const accessToken = await createAccessToken("user_abc");
    const result = await verifyToken(accessToken, "refresh");
    expect(result).toBeNull();
  });

  it("returns null when token type is verification but token is access", async () => {
    const token = await createAccessToken("user_abc");
    const result = await verifyToken(token, "verification");
    expect(result).toBeNull();
  });

  it("throws for a completely invalid token string", async () => {
    await expect(verifyToken("not-a-valid-jwt", "access")).rejects.toThrow();
  });
});

describe("getCookieSettings", () => {
  beforeEach(() => {
    mockEnv.APP_ENV = "development";
    mockEnv.APP_HOST = "localhost";
  });

  describe("access token cookie", () => {
    it("returns maxAge equal to ACCESS_TOKEN_EXPIRATION_SECONDS", () => {
      const settings = getCookieSettings("access");
      expect(settings.maxAge).toBe(ACCESS_TOKEN_EXPIRATION_SECONDS);
    });

    it("always sets httpOnly to true", () => {
      expect(getCookieSettings("access").httpOnly).toBe(true);
    });

    it("always sets path to '/'", () => {
      expect(getCookieSettings("access").path).toBe("/");
    });
  });

  describe("refresh token cookie", () => {
    it("returns maxAge equal to REFRESH_TOKEN_EXPIRATION_SECONDS", () => {
      const settings = getCookieSettings("refresh");
      expect(settings.maxAge).toBe(REFRESH_TOKEN_EXPIRATION_SECONDS);
    });
  });

  describe("clear cookie", () => {
    it("returns maxAge of 0", () => {
      const settings = getCookieSettings("clear");
      expect(settings.maxAge).toBe(0);
    });

    it("sets expires to epoch zero", () => {
      const settings = getCookieSettings("clear");
      expect((settings as any).expires).toEqual(new Date(0));
    });
  });

  describe("invalid cookie type", () => {
    it("throws for an unknown cookie type", () => {
      expect(() => getCookieSettings("invalid" as any)).toThrow("Invalid cookie type: invalid");
    });
  });

  describe("production environment", () => {
    beforeEach(() => {
      mockEnv.APP_ENV = "production";
      mockEnv.APP_HOST = "example.com";
    });

    it("sets secure to true", () => {
      expect(getCookieSettings("access").secure).toBe(true);
    });

    it("sets sameSite to 'none'", () => {
      expect(getCookieSettings("access").sameSite).toBe("none");
    });

    it("sets domain with leading dot", () => {
      expect(getCookieSettings("access").domain).toBe(".example.com");
    });
  });

  describe("development environment with normal host", () => {
    beforeEach(() => {
      mockEnv.APP_ENV = "development";
      mockEnv.APP_HOST = "localhost";
    });

    it("sets secure to false", () => {
      expect(getCookieSettings("access").secure).toBe(false);
    });

    it("sets sameSite to 'lax'", () => {
      expect(getCookieSettings("access").sameSite).toBe("lax");
    });

    it("sets domain to undefined (host-only cookie)", () => {
      expect(getCookieSettings("access").domain).toBeUndefined();
    });
  });

  describe("development environment with subdomain host", () => {
    beforeEach(() => {
      mockEnv.APP_ENV = "development";
      mockEnv.APP_HOST = "api.localhost.dev";
    });

    it("sets secure to true for subdomain dev", () => {
      expect(getCookieSettings("access").secure).toBe(true);
    });

    it("sets sameSite to 'none' for subdomain dev", () => {
      expect(getCookieSettings("access").sameSite).toBe("none");
    });

    it("sets domain with leading dot for subdomain dev", () => {
      expect(getCookieSettings("access").domain).toBe(".api.localhost.dev");
    });
  });
});

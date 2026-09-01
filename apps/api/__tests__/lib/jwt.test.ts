import { beforeEach, describe, expect, it, mock } from "bun:test";

// Mutable ENV object — functions read it at call time, so mutations take effect.
const mockEnv = {
  APP_ENV: "development" as "development" | "production",
  APP_PORT: 3000,
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
    expect(mockGetConfig).toHaveBeenCalledWith("authentication.jwt.secret");
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
  /** A context standing in for a request that reached the given origin. */
  function ctx(url: string, headers: Record<string, string> = {}): any {
    return {
      req: {
        url,
        header: (name: string) => headers[name.toLowerCase()],
      },
    };
  }

  const httpCtx = () => ctx("http://localhost:3000/auth/login");
  const httpsCtx = () => ctx("https://example.com/auth/login", {
    "x-forwarded-proto": "https",
    "x-forwarded-host": "example.com",
  });

  describe("access token cookie", () => {
    it("returns maxAge equal to ACCESS_TOKEN_EXPIRATION_SECONDS", () => {
      expect(getCookieSettings(httpCtx(), "access").maxAge).toBe(ACCESS_TOKEN_EXPIRATION_SECONDS);
    });

    it("always sets httpOnly to true", () => {
      expect(getCookieSettings(httpCtx(), "access").httpOnly).toBe(true);
    });

    it("always sets path to '/'", () => {
      expect(getCookieSettings(httpCtx(), "access").path).toBe("/");
    });
  });

  describe("refresh token cookie", () => {
    it("returns maxAge equal to REFRESH_TOKEN_EXPIRATION_SECONDS", () => {
      expect(getCookieSettings(httpCtx(), "refresh").maxAge).toBe(REFRESH_TOKEN_EXPIRATION_SECONDS);
    });
  });

  describe("clear cookie", () => {
    it("returns maxAge of 0", () => {
      expect(getCookieSettings(httpCtx(), "clear").maxAge).toBe(0);
    });

    it("sets expires to epoch zero", () => {
      expect((getCookieSettings(httpCtx(), "clear") as any).expires).toEqual(new Date(0));
    });
  });

  describe("invalid cookie type", () => {
    it("throws for an unknown cookie type", () => {
      expect(() => getCookieSettings(httpCtx(), "invalid" as any)).toThrow("Invalid cookie type: invalid");
    });
  });

  // The cookie must never carry a Domain: browsers reject one built from a bare
  // IP or a single-label host, which used to break sign-in on a LAN address.
  describe("host-only cookie", () => {
    const hosts = [
      "http://localhost:3000/",
      "http://192.168.1.50:3000/",
      "http://myapp.local/",
      "https://example.com/",
    ];

    for (const url of hosts) {
      it(`sets no domain for ${url}`, () => {
        expect((getCookieSettings(ctx(url), "access") as any).domain).toBeUndefined();
      });
    }
  });

  // SameSite=Lax still accompanies the OAuth callback (a top-level GET) while
  // blocking the cross-site POSTs that SameSite=None used to allow.
  describe("sameSite", () => {
    it("is lax over plain HTTP", () => {
      expect(getCookieSettings(httpCtx(), "access").sameSite).toBe("lax");
    });

    it("is lax over HTTPS", () => {
      expect(getCookieSettings(httpsCtx(), "access").sameSite).toBe("lax");
    });
  });

  describe("secure flag", () => {
    it("is false over plain HTTP so a LAN deployment can sign in", () => {
      expect(getCookieSettings(httpCtx(), "access").secure).toBe(false);
    });

    it("is false for a plain-HTTP IP address", () => {
      expect(getCookieSettings(ctx("http://192.168.1.50:3000/"), "access").secure).toBe(false);
    });

    it("is true when the browser reached the proxy over HTTPS", () => {
      expect(getCookieSettings(httpsCtx(), "access").secure).toBe(true);
    });

    it("is true when only the request URL is HTTPS", () => {
      expect(getCookieSettings(ctx("https://example.com/"), "access").secure).toBe(true);
    });
  });
});

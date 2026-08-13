import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS, TokenService } from "./token.service";

function createService(secret = "test-secret-at-least-32-characters-long"): TokenService {
  return new TokenService(new JwtService({ secret }));
}

describe("TokenService", () => {
  describe("access tokens", () => {
    it("signs and verifies a round-trip payload", () => {
      const service = createService();
      const payload = { sub: "user-1", tenantUserId: "tu-1", sessionId: "session-1" };

      const token = service.signAccessToken(payload);
      const decoded = service.verifyAccessToken(token);

      expect(decoded).toMatchObject(payload);
    });

    it("throws UnauthorizedException for a garbage token", () => {
      const service = createService();

      expect(() => service.verifyAccessToken("not-a-jwt")).toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException when the signature doesn't match (tampered/wrong-secret token)", () => {
      const issuer = createService("secret-a-at-least-32-characters-long");
      const verifier = createService("secret-b-at-least-32-characters-long");
      const token = issuer.signAccessToken({ sub: "u", tenantUserId: "tu", sessionId: "s" });

      expect(() => verifier.verifyAccessToken(token)).toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException for an expired token", () => {
      // A JwtService whose default expiry is already in the past - simulates
      // a token minted, then verified, after ACCESS_TOKEN_TTL_SECONDS elapsed.
      const jwtService = new JwtService({ secret: "test-secret-at-least-32-characters-long" });
      const expiredToken = jwtService.sign(
        { sub: "u", tenantUserId: "tu", sessionId: "s" },
        { expiresIn: -1 },
      );
      const service = createService();

      expect(() => service.verifyAccessToken(expiredToken)).toThrow(UnauthorizedException);
    });

    it("does not embed tenantId, branchId, or permissions in the signed payload", () => {
      const service = createService();
      const token = service.signAccessToken({ sub: "u", tenantUserId: "tu", sessionId: "s" });
      const payloadSegment = token.split(".")[1] ?? "";
      const decodedPayload = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8")) as Record<
        string,
        unknown
      >;

      expect(decodedPayload).not.toHaveProperty("tenantId");
      expect(decodedPayload).not.toHaveProperty("branchId");
      expect(decodedPayload).not.toHaveProperty("permissions");
    });
  });

  describe("refresh tokens", () => {
    it("generates a random, sufficiently long opaque token distinct from its hash", () => {
      const service = createService();
      const first = service.generateRefreshToken();
      const second = service.generateRefreshToken();

      expect(first.token).not.toBe(second.token);
      expect(first.token).not.toBe(first.tokenHash);
      expect(first.token.length).toBeGreaterThan(32);
    });

    it("hashes deterministically so the same raw token always maps to the same hash", () => {
      const service = createService();
      const { token, tokenHash } = service.generateRefreshToken();

      expect(service.hashRefreshToken(token)).toBe(tokenHash);
    });

    it("produces different hashes for different tokens", () => {
      const service = createService();

      expect(service.hashRefreshToken("token-a")).not.toBe(service.hashRefreshToken("token-b"));
    });

    it("sets expiresAt roughly REFRESH_TOKEN_TTL_SECONDS in the future", () => {
      const service = createService();
      const before = Date.now();
      const { expiresAt } = service.generateRefreshToken();
      const after = Date.now();

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + REFRESH_TOKEN_TTL_SECONDS * 1000);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(after + REFRESH_TOKEN_TTL_SECONDS * 1000);
    });
  });

  it("uses a 15-minute access token TTL", () => {
    expect(ACCESS_TOKEN_TTL_SECONDS).toBe(15 * 60);
  });
});

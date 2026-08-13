import { createHash, randomBytes } from "node:crypto";

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface AccessTokenPayload {
  sub: string; // userId
  tenantUserId: string;
  sessionId: string;
}

export interface GeneratedRefreshToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

// JWTs here carry identity only (sub/tenantId/branchId/sessionId), never
// permissions - AuthContextMiddleware always re-resolves the live
// permission set from the database on every request. See ADR 0007.
@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return this.jwtService.verify<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException("Geçersiz veya süresi dolmuş oturum.");
    }
  }

  // Refresh tokens are opaque random values, not JWTs: they carry no
  // claims, so a stolen/expired one reveals nothing and can only be used
  // as a database lookup key.
  generateRefreshToken(): GeneratedRefreshToken {
    const token = randomBytes(48).toString("base64url");
    return {
      token,
      tokenHash: this.hashRefreshToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    };
  }

  hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}

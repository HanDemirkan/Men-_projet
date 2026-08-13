import { Injectable } from "@nestjs/common";
import { prisma } from "@qr-platform/database";

import { TokenService } from "./token.service";
import type { GeneratedRefreshToken } from "./token.service";

export interface CreateSessionInput {
  userId: string;
  tenantUserId: string;
  ip?: string;
  userAgent?: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tenantUserId: string;
  expiresAt: Date;
}

export interface SessionListItem {
  id: string;
  ip: string | null;
  userAgent: string | null;
  expiresAt: Date;
  lastUsedAt: Date;
  createdAt: Date;
}

// `Session` is not in the tenant-scoped model list (see
// tenant-scoped-client.ts) - a session belongs to a user, not a tenant, and
// login/refresh/logout all run before any tenant context exists. Uses the
// raw `prisma` client throughout, deliberately.
@Injectable()
export class SessionService {
  constructor(private readonly tokenService: TokenService) {}

  async createSession(
    input: CreateSessionInput,
  ): Promise<{ session: SessionRecord; refreshToken: GeneratedRefreshToken }> {
    const refreshToken = this.tokenService.generateRefreshToken();

    const session = await prisma.session.create({
      data: {
        userId: input.userId,
        tenantUserId: input.tenantUserId,
        refreshTokenHash: refreshToken.tokenHash,
        ip: input.ip,
        userAgent: input.userAgent,
        expiresAt: refreshToken.expiresAt,
      },
    });

    return { session, refreshToken };
  }

  async findByRefreshToken(rawToken: string): Promise<SessionRecord | null> {
    const tokenHash = this.tokenService.hashRefreshToken(rawToken);
    return prisma.session.findUnique({ where: { refreshTokenHash: tokenHash } });
  }

  async findById(sessionId: string): Promise<SessionRecord | null> {
    return prisma.session.findUnique({ where: { id: sessionId } });
  }

  // Rotation is mandatory on every refresh (see ADR 0007): the same Session
  // row's hash is replaced in place rather than creating a new row, so a
  // previously-issued refresh token stops matching anything the instant a
  // newer one is issued - reuse of a rotated-away token is naturally
  // rejected by findByRefreshToken() returning null next time.
  async rotateRefreshToken(
    sessionId: string,
    context: { ip?: string; userAgent?: string } = {},
  ): Promise<{ session: SessionRecord; refreshToken: GeneratedRefreshToken }> {
    const refreshToken = this.tokenService.generateRefreshToken();

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: refreshToken.tokenHash,
        expiresAt: refreshToken.expiresAt,
        lastUsedAt: new Date(),
        ip: context.ip,
        userAgent: context.userAgent,
      },
    });

    return { session, refreshToken };
  }

  async deleteById(sessionId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }

  // Admin "session listesi" - never returns refreshTokenHash.
  async listByUserId(userId: string): Promise<SessionListItem[]> {
    return prisma.session.findMany({
      where: { userId },
      select: { id: true, ip: true, userAgent: true, expiresAt: true, lastUsedAt: true, createdAt: true },
      orderBy: { lastUsedAt: "desc" },
    });
  }

  // Admin "Session'ları sonlandır" - revokes every session for a user, or
  // just one if `exceptSessionId` narrows it (see session-revoke.policy.ts,
  // which uses this to protect the caller's own current session).
  async revokeAllForUser(userId: string, exceptSessionId?: string): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
    });
    return result.count;
  }
}

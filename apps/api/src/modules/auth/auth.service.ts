import { Injectable, UnauthorizedException } from "@nestjs/common";
import { prisma } from "@qr-platform/database";
import type { PermissionCode, Role } from "@qr-platform/permissions";

import { IdentityService } from "./services/identity.service";
import { PasswordResetService } from "./services/password-reset.service";
import { PasswordService } from "./services/password.service";
import { SessionService } from "./services/session.service";
import { TokenService } from "./services/token.service";

export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

export interface AuthUserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string | null;
  branchId: string | null;
  roleCode: Role;
  permissions: PermissionCode[];
}

export interface AuthSessionResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: AuthUserSummary;
}

const GENERIC_LOGIN_ERROR = "E-posta veya şifre hatalı.";
const GENERIC_SESSION_ERROR = "Oturum geçersiz, lütfen tekrar giriş yapın.";

// Orchestrates the auth flows; deliberately framework/HTTP-agnostic (no
// cookies, no Request/Response here) - AuthController owns that. Uses the
// raw `prisma` client throughout: every table it touches (User, Session,
// TenantUser via IdentityService, PasswordResetToken) is either not
// tenant-owned or is being resolved *before* a tenant context can exist.
@Injectable()
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly identityService: IdentityService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  async login(email: string, password: string, context: RequestContext): Promise<AuthSessionResult> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.status !== "ACTIVE" || user.deletedAt) {
      // Same generic message as a wrong password - never reveal whether the
      // email exists.
      throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
    }

    const passwordValid = await this.passwordService.verify(user.passwordHash, password);

    if (!passwordValid) {
      throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
    }

    const membership = await this.identityService.resolvePrimaryMembership(user.id);

    const { session, refreshToken } = await this.sessionService.createSession({
      userId: user.id,
      tenantUserId: membership.tenantUserId,
      ip: context.ip,
      userAgent: context.userAgent,
    });

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      tenantUserId: membership.tenantUserId,
      sessionId: session.id,
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return this.buildResult(accessToken, refreshToken, user, membership);
  }

  async refresh(rawRefreshToken: string, context: RequestContext): Promise<AuthSessionResult> {
    const session = await this.sessionService.findByRefreshToken(rawRefreshToken);

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException(GENERIC_SESSION_ERROR);
    }

    const membership = await this.identityService.resolveMembershipById(session.tenantUserId);
    const user = membership ? await prisma.user.findUnique({ where: { id: session.userId } }) : null;

    if (!membership || !user || user.status !== "ACTIVE" || user.deletedAt) {
      await this.sessionService.deleteById(session.id);
      throw new UnauthorizedException(GENERIC_SESSION_ERROR);
    }

    const { session: rotatedSession, refreshToken } = await this.sessionService.rotateRefreshToken(
      session.id,
      context,
    );

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      tenantUserId: membership.tenantUserId,
      sessionId: rotatedSession.id,
    });

    return this.buildResult(accessToken, refreshToken, user, membership);
  }

  // Identified by sessionId (from the access token), not the refresh token
  // cookie: refresh_token is deliberately path-scoped to /auth/refresh (see
  // ADR 0007) and is never sent by the browser to /auth/logout.
  async logout(sessionId: string): Promise<void> {
    await this.sessionService.deleteById(sessionId);
  }

  // Always succeeds from the caller's point of view (controller returns 200
  // regardless) - the returned token is null when there's nothing to do, so
  // user enumeration isn't possible via response timing/shape.
  async forgotPassword(email: string): Promise<{ userId: string; token: string } | null> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.status !== "ACTIVE" || user.deletedAt) {
      return null;
    }

    const token = await this.passwordResetService.createResetToken(user.id);
    return { userId: user.id, token };
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const userId = await this.passwordResetService.consumeResetToken(rawToken);

    if (!userId) {
      throw new UnauthorizedException("Bağlantı geçersiz veya süresi dolmuş.");
    }

    const passwordHash = await this.passwordService.hash(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    // A password reset ends every other session, not just the one that
    // requested it.
    await prisma.session.deleteMany({ where: { userId } });
  }

  private buildResult(
    accessToken: string,
    refreshToken: { token: string; expiresAt: Date },
    user: { id: string; email: string; firstName: string; lastName: string },
    membership: {
      tenantId: string | null;
      branchId: string | null;
      roleCode: Role;
      permissions: PermissionCode[];
    },
  ): AuthSessionResult {
    return {
      accessToken,
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: membership.tenantId,
        branchId: membership.branchId,
        roleCode: membership.roleCode,
        permissions: membership.permissions,
      },
    };
  }
}

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { PinoLogger } from "nestjs-pino";

import { AppConfigService } from "../../common/config/app-config.service";
import type { RequestWithId } from "../../common/types/request-context.types";
import { AuditService } from "../audit/audit.service";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE_PATH } from "./auth.constants";
import { AuthService } from "./auth.service";
import type { AuthUserSummary, RequestContext } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from "./services/token.service";
import type { AuthenticatedUser } from "./types/authenticated-user.types";

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string | null;
  branchId: string | null;
  role: string;
  permissions: string[];
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly appConfig: AppConfigService,
    private readonly auditService: AuditService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthController.name);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  @ApiOperation({ summary: "E-posta/şifre ile giriş yapar, oturum cookie'lerini set eder" })
  async login(
    @Body() dto: LoginDto,
    @Req() request: RequestWithId,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponse> {
    const result = await this.authService.login(dto.email, dto.password, this.buildContext(request));

    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    await this.auditService.log({
      tenantId: result.user.tenantId,
      userId: result.user.id,
      action: "auth.login",
      entity: "User",
      entityId: result.user.id,
      requestId: request.requestId,
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });

    return this.toUserResponse(result.user);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("logout")
  @ApiOperation({ summary: "Oturumu sonlandırır" })
  async logout(
    @Req() request: RequestWithId,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ loggedOut: true }> {
    if (request.user) {
      await this.authService.logout(request.user.sessionId);
    }

    await this.auditService.log({
      tenantId: request.user?.tenantId ?? null,
      userId: request.user?.userId ?? null,
      action: "auth.logout",
      entity: "User",
      entityId: request.user?.userId ?? null,
      requestId: request.requestId,
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });

    this.clearAuthCookies(response);

    return { loggedOut: true };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  @ApiOperation({ summary: "Refresh token'ı rotate eder, yeni access/refresh cookie'leri set eder" })
  async refresh(
    @Req() request: RequestWithId,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponse> {
    const refreshToken = this.readRefreshToken(request);

    if (!refreshToken) {
      throw new UnauthorizedException("Oturum geçersiz, lütfen tekrar giriş yapın.");
    }

    const result = await this.authService.refresh(refreshToken, this.buildContext(request));
    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return this.toUserResponse(result.user);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("forgot-password")
  @ApiOperation({ summary: "Şifre sıfırlama token'ı üretir (her zaman 200 döner, generic)" })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    const result = await this.authService.forgotPassword(dto.email);

    if (result) {
      const resetLink = `${this.appConfig.passwordResetUrl}?token=${result.token}`;
      // No email provider is configured yet (documented in the Sprint 2
      // delivery notes) - logging the link keeps the rest of the flow
      // (token generation, hashing, single-use, expiry) fully real and
      // exercisable until one is wired up.
      this.logger.info({ userId: result.userId, resetLink }, "Password reset link generated");
    }

    return { message: "E-posta adresiniz kayıtlıysa, sıfırlama bağlantısı gönderildi." };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("reset-password")
  @ApiOperation({ summary: "Geçerli bir token ile şifreyi sıfırlar (tek kullanımlık)" })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: "Şifreniz güncellendi." };
  }

  @Get("me")
  @ApiOperation({ summary: "Oturum sahibinin kimlik/rol/izin bilgisini döner" })
  me(@CurrentUser() user: AuthenticatedUser): UserResponse {
    return {
      id: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: user.tenantId,
      branchId: user.branchId,
      role: user.roleCode,
      permissions: user.permissions,
    };
  }

  private buildContext(request: RequestWithId): RequestContext {
    return { ip: request.ip, userAgent: request.headers["user-agent"] };
  }

  private readRefreshToken(request: RequestWithId): string | undefined {
    const cookies = request.cookies as Record<string, string | undefined> | undefined;
    return cookies?.[REFRESH_TOKEN_COOKIE];
  }

  private setAuthCookies(response: Response, accessToken: string, refreshToken: string): void {
    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: this.appConfig.isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
    });

    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.appConfig.isProduction,
      sameSite: "lax",
      path: REFRESH_TOKEN_COOKIE_PATH,
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    });
  }

  private clearAuthCookies(response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
    response.clearCookie(REFRESH_TOKEN_COOKIE, { path: REFRESH_TOKEN_COOKIE_PATH });
  }

  private toUserResponse(user: AuthUserSummary): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: user.tenantId,
      branchId: user.branchId,
      role: user.roleCode,
      permissions: user.permissions,
    };
  }
}

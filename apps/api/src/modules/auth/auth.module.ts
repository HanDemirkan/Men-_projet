import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AppConfigService } from "../../common/config/app-config.service";
import { ConfigModule } from "../../common/config/config.module";
import { AuditModule } from "../audit/audit.module";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthContextMiddleware } from "./middleware/auth-context.middleware";
import { IdentityService } from "./services/identity.service";
import { PasswordResetService } from "./services/password-reset.service";
import { PasswordService } from "./services/password.service";
import { SessionService } from "./services/session.service";
import { TokenService } from "./services/token.service";

@Module({
  imports: [
    ConfigModule,
    AuditModule,
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        secret: appConfig.jwtAccessSecret,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    IdentityService,
    PasswordResetService,
    AuthContextMiddleware,
  ],
  // AuthContextMiddleware and IdentityService/TokenService are consumed
  // outside this module: AppModule applies the middleware globally, and
  // future modules will need IdentityService to resolve `AuthenticatedUser`
  // shapes for things like websocket auth if that's ever added. SessionService
  // is exported for AdminModule's user-session management endpoints.
  exports: [AuthContextMiddleware, IdentityService, TokenService, SessionService],
})
export class AuthModule {}

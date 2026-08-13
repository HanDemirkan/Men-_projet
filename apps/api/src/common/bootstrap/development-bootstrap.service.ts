import { Injectable, OnModuleInit } from "@nestjs/common";
import { createSuperAdminIfMissing, splitFullName } from "@qr-platform/database";
import * as argon2 from "argon2";
import { PinoLogger } from "nestjs-pino";
import { z } from "zod";

import { AppConfigService } from "../config/app-config.service";

// Same policy as ResetPasswordDto (modules/auth/dto/reset-password.dto.ts) and
// packages/database/prisma/bootstrap-admin.ts - one password policy for the
// whole system. Deliberately a separate, stricter, LOCAL schema (not the
// shared packages/validation env schema, which only checks shape/presence)
// so a malformed DEV_ADMIN_* value fails here with a clear message instead
// of silently producing a broken account.
const devAdminSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(8, "en az 8 karakter olmalı")
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "en az bir harf ve bir rakam içermelidir"),
});

// Development convenience only: when `pnpm dev` starts the API in NODE_ENV=development
// with DEV_ADMIN_* configured, ensures a fixed, known SUPER_ADMIN account exists
// so a developer can log in immediately without running `pnpm bootstrap:admin`
// separately. Never runs outside development, and a failure here must never
// crash the API - this is a convenience, not a required boot step.
@Injectable()
export class DevelopmentBootstrapService implements OnModuleInit {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DevelopmentBootstrapService.name);
  }

  async onModuleInit(): Promise<void> {
    if (!this.appConfig.isDevelopment) {
      this.logger.info("Development super admin bootstrap skipped outside development");
      return;
    }

    const parsed = devAdminSchema.safeParse({
      name: this.appConfig.devAdminName,
      email: this.appConfig.devAdminEmail,
      password: this.appConfig.devAdminPassword,
    });

    if (!parsed.success) {
      // Never log the raw DEV_ADMIN_* values (would leak the password) -
      // only the field-level validation issues.
      const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
      this.logger.warn(`Development super admin bootstrap skipped: invalid configuration (${issues})`);
      return;
    }

    const { name, email, password } = parsed.data;
    const { firstName, lastName } = splitFullName(name);
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const result = await createSuperAdminIfMissing({ firstName, lastName, email, passwordHash });

    if (result.status === "created") {
      this.logger.info("Development super admin created");
    } else {
      this.logger.info("Development super admin ready");
    }
  }
}

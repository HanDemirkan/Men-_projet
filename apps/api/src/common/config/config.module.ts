import { Global, Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";

import { AppConfigService } from "./app-config.service";
import { validateApiEnv } from "./env.schema";

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      // Mirrors Next.js's own env file precedence so all three apps share one
      // mental model. Root-relative because Nest/turbo run with `apps/api`
      // as cwd; `dotenv-cli` (see root package.json scripts) has usually
      // already injected these into `process.env` by the time this runs, so
      // this mainly matters when the API is started directly (e.g. PM2's own
      // `env_file`, which also targets these same root files).
      envFilePath: [
        `../../.env.${process.env["NODE_ENV"] ?? "development"}.local`,
        `../../.env.${process.env["NODE_ENV"] ?? "development"}`,
        "../../.env.local",
        "../../.env",
      ],
      validate: validateApiEnv,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}

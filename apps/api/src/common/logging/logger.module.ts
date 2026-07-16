import { Module } from "@nestjs/common";
import { LoggerModule as PinoLoggerModule } from "nestjs-pino";

import { AppConfigService } from "../config/app-config.service";
import type { RequestWithId } from "../types/request-context.types";

const SENSITIVE_FIELD_PATTERNS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'req.headers["set-cookie"]',
  "*.password",
  "*.token",
  "*.secret",
  "*.accessKey",
  "*.secretKey",
];

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        pinoHttp: {
          level: appConfig.logLevel,
          redact: {
            paths: SENSITIVE_FIELD_PATTERNS,
            censor: "[REDACTED]",
          },
          base: {
            application: "api",
            environment: appConfig.nodeEnv,
          },
          transport: appConfig.isProduction
            ? undefined
            : { target: "pino-pretty", options: { colorize: true, singleLine: true } },
          customProps: (req) => ({
            requestId: (req as RequestWithId).requestId,
          }),
          customSuccessMessage: (req, res) =>
            `${req.method} ${req.url} completed with ${res.statusCode}`,
          customErrorMessage: (req, res, err) =>
            `${req.method} ${req.url} failed with ${res.statusCode}: ${err.message}`,
        },
      }),
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}

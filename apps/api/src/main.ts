import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import * as express from "express";
import helmet from "helmet";
import { Logger, PinoLogger } from "nestjs-pino";

import { AppModule } from "./app.module";
import { AppConfigService } from "./common/config/app-config.service";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

const API_GLOBAL_PREFIX = "api/v1";
const SWAGGER_PATH = "api/docs";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  const appConfig = app.get(AppConfigService);
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix(API_GLOBAL_PREFIX);

  // Production runs behind the Nginx reverse proxy set up in Sprint 0,
  // which sets X-Forwarded-For/-Proto - without this, `req.ip` and the
  // `secure` cookie flag would see the proxy's connection, not the client's.
  app.set("trust proxy", 1);

  app.use(express.json({ limit: appConfig.requestBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: appConfig.requestBodyLimit }));
  app.use(cookieParser());

  // Swagger UI's own inline bootstrap script needs `unsafe-inline` for
  // script-src - only relaxed when docs are actually mounted (never in
  // production, see below), so production's CSP stays exactly as strict as
  // before.
  app.use(helmet({ contentSecurityPolicy: appConfig.isProduction ? undefined : false }));
  app.enableCors({ origin: appConfig.corsAllowedOrigins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter(await app.resolve(PinoLogger), appConfig));

  // Docs are dev/staging-only by design - reduces attack surface in
  // production and avoids relaxing CSP there (see helmet() call above).
  if (!appConfig.isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("QR Platform API")
      .setDescription("QR Platform REST API - Sprint 2 (auth) + Sprint 3A (business profile, media, menu domain)")
      .setVersion("1.0")
      .addCookieAuth("access_token", { type: "apiKey", in: "cookie", name: "access_token" })
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(SWAGGER_PATH, app, swaggerDocument);
  }

  app.enableShutdownHooks();

  // Explicit host (not just port) so the API is reachable from other devices
  // on the LAN in development - e.g. a phone scanning a QR code (Sprint 6).
  await app.listen(appConfig.port, appConfig.host);
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to bootstrap API application", error);
  process.exit(1);
});

import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import * as express from "express";
import helmet from "helmet";
import { Logger, PinoLogger } from "nestjs-pino";

import { AppModule } from "./app.module";
import { AppConfigService } from "./common/config/app-config.service";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

const API_GLOBAL_PREFIX = "api/v1";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  const appConfig = app.get(AppConfigService);
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix(API_GLOBAL_PREFIX);

  app.use(express.json({ limit: appConfig.requestBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: appConfig.requestBodyLimit }));

  app.use(helmet());
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

  app.enableShutdownHooks();

  await app.listen(appConfig.port);
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to bootstrap API application", error);
  process.exit(1);
});

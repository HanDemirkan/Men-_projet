import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Response } from "express";
import { PinoLogger } from "nestjs-pino";

import { AppConfigService } from "../config/app-config.service";
import type { AppExceptionDetail } from "../exceptions/app.exception";
import { AppException } from "../exceptions/app.exception";
import type { RequestWithId } from "../types/request-context.types";

interface ErrorPayload {
  code: string;
  message: string;
  details: AppExceptionDetail[];
}

const DEFAULT_ERROR_CODE = "INTERNAL_SERVER_ERROR";
const VALIDATION_ERROR_CODE = "VALIDATION_ERROR";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: PinoLogger,
    private readonly appConfig: AppConfigService,
  ) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    const { status, payload } = this.resolveError(exception);

    this.logger.error(
      { err: exception, requestId: request.requestId, statusCode: status },
      "Request failed",
    );

    response.status(status).json({
      success: false,
      error: payload,
      requestId: request.requestId,
    });
  }

  private resolveError(exception: unknown): { status: number; payload: ErrorPayload } {
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        payload: { code: exception.code, message: exception.message, details: exception.details },
      };
    }

    if (exception instanceof HttpException) {
      return this.resolveHttpException(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      payload: {
        code: DEFAULT_ERROR_CODE,
        message: this.appConfig.isProduction
          ? "An unexpected error occurred."
          : this.describeUnknownException(exception),
        details: [],
      },
    };
  }

  private resolveHttpException(exception: HttpException): {
    status: number;
    payload: ErrorPayload;
  } {
    const status = exception.getStatus();
    const response = exception.getResponse();

    if (status === HttpStatus.NOT_FOUND) {
      return {
        status,
        payload: {
          code: "NOT_FOUND",
          message: "The requested resource was not found.",
          details: [],
        },
      };
    }

    if (typeof response === "object" && response !== null && "message" in response) {
      const rawMessage = (response as { message: unknown }).message;
      const details: AppExceptionDetail[] = Array.isArray(rawMessage)
        ? rawMessage.map((message) => ({ message: String(message) }))
        : [];
      const code = status === HttpStatus.BAD_REQUEST ? VALIDATION_ERROR_CODE : exception.name;

      return {
        status,
        payload: {
          code,
          message: Array.isArray(rawMessage)
            ? "The submitted data is invalid."
            : String(rawMessage),
          details,
        },
      };
    }

    return { status, payload: { code: exception.name, message: exception.message, details: [] } };
  }

  private describeUnknownException(exception: unknown): string {
    return exception instanceof Error ? exception.message : "An unexpected error occurred.";
  }
}

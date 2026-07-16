import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { ApiSuccessResponse } from "@qr-platform/shared";
import type { Observable } from "rxjs";
import { map } from "rxjs";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        meta: null,
      })),
    );
  }
}

import { randomUUID } from "node:crypto";

import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Response } from "express";

import type { RequestWithId } from "../types/request-context.types";

export const REQUEST_ID_HEADER = "x-request-id";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const incomingRequestId = req.headers[REQUEST_ID_HEADER];
    const requestId = typeof incomingRequestId === "string" ? incomingRequestId : randomUUID();

    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    next();
  }
}

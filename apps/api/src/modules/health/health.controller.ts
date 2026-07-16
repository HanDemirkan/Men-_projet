import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import type { HealthStatus } from "@qr-platform/shared";

import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // Combined status used by the web dashboard. Kept for backward
  // compatibility alongside the operational endpoints below.
  @Get()
  async check(): Promise<HealthStatus> {
    return this.healthService.check();
  }

  // Liveness: "is the process able to respond at all". No dependency
  // checks - a slow/degraded database or Redis must not cause an
  // orchestrator (PM2, a future container platform) to kill the process.
  @Get("live")
  live(): { status: "up" } {
    return { status: "up" };
  }

  // Readiness: "can this instance actually serve traffic". Returns 503 when
  // a dependency is down so PM2/Nginx/health checks can react accordingly.
  @Get("ready")
  async ready(): Promise<HealthStatus> {
    const result = await this.healthService.check();

    if (result.status !== "healthy") {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}

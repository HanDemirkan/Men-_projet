import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { HealthStatus } from "@qr-platform/shared";

import { Public } from "../auth/decorators/public.decorator";

import { HealthService } from "./health.service";

// Health checks are hit by PM2/Nginx/orchestrators without credentials -
// they must stay reachable even though JwtAuthGuard is deny-by-default globally.
@ApiTags("health")
@Public()
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // Combined status used by the web dashboard. Kept for backward
  // compatibility alongside the operational endpoints below.
  @Get()
  @ApiOperation({ summary: "API/DB/Redis birleşik durumu" })
  async check(): Promise<HealthStatus> {
    return this.healthService.check();
  }

  // Liveness: "is the process able to respond at all". No dependency
  // checks - a slow/degraded database or Redis must not cause an
  // orchestrator (PM2, a future container platform) to kill the process.
  @Get("live")
  @ApiOperation({ summary: "Liveness - süreç yanıt veriyor mu" })
  live(): { status: "up" } {
    return { status: "up" };
  }

  // Readiness: "can this instance actually serve traffic". Returns 503 when
  // a dependency is down so PM2/Nginx/health checks can react accordingly.
  @Get("ready")
  @ApiOperation({ summary: "Readiness - trafik alabilir mi (503 olabilir)" })
  async ready(): Promise<HealthStatus> {
    const result = await this.healthService.check();

    if (result.status !== "healthy") {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}

import { Controller, Get } from "@nestjs/common";
import type { HealthStatus } from "@qr-platform/shared";

import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check(): Promise<HealthStatus> {
    return this.healthService.check();
  }
}

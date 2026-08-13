import type { HealthStatus, ServiceStatus } from "@qr-platform/shared";

export interface AdminSystemInfo {
  status: HealthStatus["status"];
  services: HealthStatus["services"] & { worker: ServiceStatus };
  environment: string;
  version: string;
  uptimeSeconds: number;
  storage: { status: ServiceStatus };
  lastMigration: { name: string; finishedAt: string } | null;
  timestamp: string;
}

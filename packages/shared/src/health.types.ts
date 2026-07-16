export type ServiceStatus = "up" | "down";

export interface HealthServices {
  api: ServiceStatus;
  database: ServiceStatus;
  redis: ServiceStatus;
}

export interface HealthStatus {
  status: "healthy" | "degraded";
  services: HealthServices;
  timestamp: string;
}

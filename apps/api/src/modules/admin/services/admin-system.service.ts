import { readFileSync } from "node:fs";
import { access } from "node:fs/promises";
import { join } from "node:path";

import { Injectable } from "@nestjs/common";
import { prisma } from "@qr-platform/database";
import type { ServiceStatus } from "@qr-platform/shared";

import { AppConfigService } from "../../../common/config/app-config.service";
import { HealthService } from "../../health/health.service";
import type { AdminSystemInfo } from "../types/admin-system.types";

// Read at runtime (not `import ... from "../../../../package.json"`) so
// TypeScript's `include`/rootDir computation for this project (scoped to
// `src/**`) never has to account for a file outside it.
function readApiVersion(): string {
  try {
    const raw = readFileSync(join(__dirname, "../../../../package.json"), "utf-8");
    return (JSON.parse(raw) as { version: string }).version;
  } catch {
    return "unknown";
  }
}

interface MigrationRow {
  migration_name: string;
  finished_at: Date;
}

// Never spreads `process.env` or any AppConfigService getter that returns a
// secret (JWT_ACCESS_SECRET, DATABASE_URL, REDIS_URL) - only derived,
// non-sensitive facts about the running process.
@Injectable()
export class AdminSystemService {
  constructor(
    private readonly healthService: HealthService,
    private readonly appConfig: AppConfigService,
  ) {}

  async get(): Promise<AdminSystemInfo> {
    const [health, worker, storage, lastMigration] = await Promise.all([
      this.healthService.check(),
      this.checkWorker(),
      this.checkStorage(),
      this.findLastMigration(),
    ]);

    return {
      status: worker === "up" ? health.status : "degraded",
      services: { ...health.services, worker },
      environment: this.appConfig.nodeEnv,
      version: readApiVersion(),
      uptimeSeconds: Math.round(process.uptime()),
      storage: { status: storage },
      lastMigration,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkWorker(): Promise<ServiceStatus> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(this.appConfig.workerHealthUrl, { signal: controller.signal });
      clearTimeout(timeout);
      return response.ok ? "up" : "down";
    } catch {
      return "down";
    }
  }

  private async checkStorage(): Promise<ServiceStatus> {
    try {
      await access(this.appConfig.storageDir);
      return "up";
    } catch {
      return "down";
    }
  }

  // Prisma's own migration history table - not part of the app's schema
  // models, so this is a raw query. "Mümkünse" (if possible): wrapped so a
  // missing/inaccessible table degrades to `null` instead of failing the
  // whole system endpoint.
  private async findLastMigration(): Promise<AdminSystemInfo["lastMigration"]> {
    try {
      const rows = await prisma.$queryRaw<MigrationRow[]>`
        SELECT migration_name, finished_at FROM _prisma_migrations
        WHERE finished_at IS NOT NULL
        ORDER BY finished_at DESC
        LIMIT 1
      `;
      const latest = rows[0];
      return latest ? { name: latest.migration_name, finishedAt: latest.finished_at.toISOString() } : null;
    } catch {
      return null;
    }
  }
}

import type { ListAuditLogsQueryDto } from "../dto/list-audit-logs-query.dto";
import type { AuditLogWithActor } from "../repositories/admin-audit.repository";
import { AdminAuditRepository } from "../repositories/admin-audit.repository";

import { AdminAuditService } from "./admin-audit.service";

jest.mock("../repositories/admin-audit.repository");

function buildLog(overrides: Partial<AuditLogWithActor> = {}): AuditLogWithActor {
  return {
    id: "log-1",
    tenantId: null,
    branchId: null,
    userId: "user-1",
    action: "admin.tenant.create",
    entity: "Tenant",
    entityId: "tenant-1",
    requestId: "req-1",
    oldValue: null,
    newValue: { owner: { email: "a@b.com", password: "should-never-be-here", token: "secret-token" } },
    ip: "127.0.0.1",
    userAgent: "jest",
    createdAt: new Date(),
    user: null,
    tenant: null,
    ...overrides,
  };
}

describe("AdminAuditService", () => {
  it("masks sensitive-looking keys in oldValue/newValue before returning results", async () => {
    const repository = new AdminAuditRepository() as jest.Mocked<AdminAuditRepository>;
    repository.findMany = jest.fn().mockResolvedValue({ logs: [buildLog()], total: 1 });

    const service = new AdminAuditService(repository);
    const result = await service.list({ page: 1, pageSize: 20 } as ListAuditLogsQueryDto);

    const [log] = result.items;
    expect(log?.newValue).toMatchObject({
      owner: { email: "a@b.com", password: "[REDACTED]", token: "[REDACTED]" },
    });
  });

  it("leaves non-sensitive fields untouched", async () => {
    const repository = new AdminAuditRepository() as jest.Mocked<AdminAuditRepository>;
    repository.findMany = jest.fn().mockResolvedValue({
      logs: [buildLog({ newValue: { tenant: { name: "Sahil Cafe", slug: "sahil-cafe" } } })],
      total: 1,
    });

    const service = new AdminAuditService(repository);
    const result = await service.list({ page: 1, pageSize: 20 } as ListAuditLogsQueryDto);

    expect(result.items[0]?.newValue).toEqual({ tenant: { name: "Sahil Cafe", slug: "sahil-cafe" } });
  });
});

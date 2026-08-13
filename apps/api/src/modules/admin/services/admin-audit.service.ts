import { Injectable } from "@nestjs/common";

import { toPaginatedResult } from "../../../common/pagination";
import { redactAuditLog } from "../../../common/redact-audit-value";
import type { ListAuditLogsQueryDto } from "../dto/list-audit-logs-query.dto";
import { AdminAuditRepository } from "../repositories/admin-audit.repository";

@Injectable()
export class AdminAuditService {
  constructor(private readonly auditRepository: AdminAuditRepository) {}

  async list(query: ListAuditLogsQueryDto) {
    const { logs, total } = await this.auditRepository.findMany(query);
    return toPaginatedResult(logs.map(redactAuditLog), total, query.page, query.pageSize);
  }
}

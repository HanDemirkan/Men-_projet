import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import { ListAuditLogsQueryDto } from "../dto/list-audit-logs-query.dto";
import { AdminAuditService } from "../services/admin-audit.service";

@ApiTags("admin-audit")
@Controller("admin/audit-logs")
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ADMIN_AUDIT_READ)
  @ApiOperation({ summary: "Platform genelinde audit kayıtlarını filtre/sayfalama ile listeler" })
  list(@Query() query: ListAuditLogsQueryDto) {
    return this.auditService.list(query);
  }
}

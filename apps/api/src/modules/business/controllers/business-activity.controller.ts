import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import { ListActivityQueryDto } from "../dto/list-activity-query.dto";
import { BusinessActivityService } from "../services/business-activity.service";

@ApiTags("business-activity")
@Controller("business/activity")
export class BusinessActivityController {
  constructor(private readonly activityService: BusinessActivityService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.BUSINESS_ACTIVITY_READ)
  @ApiOperation({ summary: "Yalnızca çağıranın kendi işletmesine ait audit kayıtlarını listeler" })
  list(@Query() query: ListActivityQueryDto) {
    return this.activityService.list(query);
  }
}

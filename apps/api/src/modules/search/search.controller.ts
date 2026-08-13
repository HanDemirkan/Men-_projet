import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";

import { SearchService } from "./search.service";

@ApiTags("search")
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCT_READ)
  @ApiOperation({ summary: "Ürün/Kategori/Variant/Option içinde anlık arama" })
  search(@Query("q") q?: string) {
    return this.searchService.search(q ?? "");
  }
}

import { Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";

import { UpdateStorefrontConfigDraftDto } from "./dto/update-storefront-config-draft.dto";
import { StorefrontConfigService } from "./storefront-config.service";

@ApiTags("storefront-config")
@Controller("storefront-config")
export class StorefrontConfigController {
  constructor(private readonly storefrontConfigService: StorefrontConfigService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.TENANT_READ)
  @ApiOperation({ summary: "Yayındaki ve taslak storefront konfigürasyonunu döner" })
  get(@CurrentTenant() tenantId: string | null) {
    this.requireTenant(tenantId);
    return this.storefrontConfigService.get(tenantId as string);
  }

  @Patch("draft")
  @RequirePermissions(PERMISSIONS.THEME_UPDATE)
  @ApiOperation({ summary: "QR Builder taslağını günceller (storefront'u etkilemez)" })
  updateDraft(@CurrentTenant() tenantId: string | null, @Body() dto: UpdateStorefrontConfigDraftDto) {
    this.requireTenant(tenantId);
    return this.storefrontConfigService.updateDraft(tenantId as string, dto);
  }

  @Post("publish")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.STOREFRONT_PUBLISH)
  @ApiOperation({ summary: "Taslağı yayına alır (public storefront'u günceller)" })
  publish(@CurrentTenant() tenantId: string | null) {
    this.requireTenant(tenantId);
    return this.storefrontConfigService.publish(tenantId as string);
  }

  @Post("revert")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.STOREFRONT_PUBLISH)
  @ApiOperation({ summary: "Bir önceki yayına geri döner (en az 2 yayın geçmişi gerektirir)" })
  revert(@CurrentTenant() tenantId: string | null) {
    this.requireTenant(tenantId);
    return this.storefrontConfigService.revert(tenantId as string);
  }

  private requireTenant(tenantId: string | null): void {
    if (!tenantId) {
      throw new ForbiddenException("Bu işlem için bir işletmeye bağlı olmanız gerekir.");
    }
  }
}

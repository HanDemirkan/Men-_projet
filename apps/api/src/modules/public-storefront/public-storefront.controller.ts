import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Tenant, TenantStorefrontConfig } from "@qr-platform/database";

import { Public } from "../auth/decorators/public.decorator";

import { CurrentPublicTenant } from "./decorators/current-public-tenant.decorator";
import { PublicStorefrontService } from "./public-storefront.service";

type TenantWithStorefrontConfig = Tenant & { storefrontConfig: TenantStorefrontConfig | null };

// Every route here sits behind PublicStorefrontContextMiddleware (bound in
// AppModule.configure() to this exact controller), which resolves
// `:tenantSlug` into a real tenant + tenant-scoped Prisma context before any
// handler runs - see ADR 0009. No JwtAuthGuard/PermissionsGuard requirement
// (all @Public()); a wrong/typo'd slug already 404s in the middleware.
@ApiTags("public-storefront")
@Controller("storefront/:tenantSlug")
@Public()
export class PublicStorefrontController {
  constructor(private readonly storefrontService: PublicStorefrontService) {}

  @Get()
  @ApiOperation({ summary: "İşletmenin public storefront ana sayfası" })
  async getHome(@CurrentPublicTenant() tenant: TenantWithStorefrontConfig, @Query("src") src?: string) {
    await this.storefrontService.recordView(tenant, src);
    return this.storefrontService.getHome(tenant);
  }

  @Get("menu")
  @ApiOperation({ summary: "Yayınlanan tüm menüler/kategoriler/ürünler" })
  getMenu(@CurrentPublicTenant() tenant: TenantWithStorefrontConfig) {
    return this.storefrontService.getMenu(tenant);
  }

  @Get("category/:categorySlug")
  @ApiOperation({ summary: "Tek bir kategori ve ürünleri" })
  getCategory(@CurrentPublicTenant() tenant: TenantWithStorefrontConfig, @Param("categorySlug") categorySlug: string) {
    return this.storefrontService.getCategory(tenant, categorySlug);
  }

  @Get("product/:productSlug")
  @ApiOperation({ summary: "Tek bir ürün detayı (variant/seçenek dahil)" })
  getProduct(@CurrentPublicTenant() tenant: TenantWithStorefrontConfig, @Param("productSlug") productSlug: string) {
    return this.storefrontService.getProduct(tenant, productSlug);
  }
}

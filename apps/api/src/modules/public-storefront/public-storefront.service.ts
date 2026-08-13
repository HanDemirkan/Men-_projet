import { Injectable, NotFoundException } from "@nestjs/common";
import { tenantScopedPrisma } from "@qr-platform/database";
import type { Tenant, TenantStorefrontConfig } from "@qr-platform/database";
import type { TemplateCode } from "@qr-platform/shared";
import { DEFAULT_TEMPLATE_CODE, mergeStorefrontConfig } from "@qr-platform/shared";

type TenantWithStorefrontConfig = Tenant & { storefrontConfig: TenantStorefrontConfig | null };

// "Published" is a separate concern from tenant isolation (which the
// PublicStorefrontContextMiddleware already guarantees) - a draft Menu, an
// inactive Category, or an unavailable/archived Product must never reach an
// anonymous storefront visitor even though it's still readable inside the
// tenant's own Business Panel. See ADR 0009.
const PUBLISHED_PRODUCT_WHERE = { isAvailable: true, deletedAt: null } as const;

function isMenuCurrentlyActive(menu: { activeFrom: Date | null; activeUntil: Date | null }): boolean {
  const now = new Date();
  if (menu.activeFrom && menu.activeFrom > now) {
    return false;
  }
  if (menu.activeUntil && menu.activeUntil < now) {
    return false;
  }
  return true;
}

@Injectable()
export class PublicStorefrontService {
  // One real row per home-page hit - powers the business dashboard's "QR
  // görüntülenme sayısı"/"Son 7 günlük görüntülenme" (see BusinessDashboardService).
  // `source` is "qr" only when the request's own `?src=qr` matches what
  // QrService bakes into the generated code; every other value/absence is
  // still counted, just untagged. Never lets a tracking failure fail the
  // actual page request - a visitor must always get their storefront even
  // if this write fails for some reason.
  async recordView(tenant: Tenant, source: string | undefined): Promise<void> {
    try {
      await tenantScopedPrisma.storefrontView.create({
        data: { tenantId: tenant.id, source: source === "qr" ? "qr" : null },
      });
    } catch {
      // Deliberately swallowed - see above.
    }
  }

  async getHome(tenant: TenantWithStorefrontConfig) {
    const menus = await tenantScopedPrisma.menu.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
    });

    return {
      tenant: this.serializeTenant(tenant),
      storefrontConfig: this.resolvePublishedConfig(tenant),
      menus: menus.filter(isMenuCurrentlyActive).map((menu) => ({ id: menu.id, name: menu.name })),
    };
  }

  async getMenu(tenant: TenantWithStorefrontConfig) {
    const menus = await tenantScopedPrisma.menu.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      include: {
        categories: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
          include: {
            products: {
              where: PUBLISHED_PRODUCT_WHERE,
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    return {
      tenant: this.serializeTenant(tenant),
      storefrontConfig: this.resolvePublishedConfig(tenant),
      menus: menus.filter(isMenuCurrentlyActive),
    };
  }

  async getCategory(tenant: TenantWithStorefrontConfig, categorySlug: string) {
    const category = await tenantScopedPrisma.category.findFirst({
      where: { slug: categorySlug, active: true },
      include: {
        products: { where: PUBLISHED_PRODUCT_WHERE, orderBy: { sortOrder: "asc" } },
      },
    });

    if (!category) {
      throw new NotFoundException("Kategori bulunamadı.");
    }

    return {
      tenant: this.serializeTenant(tenant),
      storefrontConfig: this.resolvePublishedConfig(tenant),
      category,
    };
  }

  async getProduct(tenant: TenantWithStorefrontConfig, productSlug: string) {
    const product = await tenantScopedPrisma.product.findFirst({
      where: { slug: productSlug, ...PUBLISHED_PRODUCT_WHERE },
      include: {
        variants: { orderBy: { sortOrder: "asc" } },
        optionGroups: { orderBy: { sortOrder: "asc" }, include: { options: { orderBy: { sortOrder: "asc" } } } },
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException("Ürün bulunamadı.");
    }

    return {
      tenant: this.serializeTenant(tenant),
      storefrontConfig: this.resolvePublishedConfig(tenant),
      product,
    };
  }

  // Merges the PUBLISHED config only - never the draft, which is the QR
  // Builder's unpublished working copy and must never reach an anonymous
  // visitor (see ADR 0009). Absence of a TenantStorefrontConfig row at all
  // (never customized) falls back to the default template's own defaults,
  // same as before Sprint 7's table extraction.
  private resolvePublishedConfig(tenant: TenantWithStorefrontConfig) {
    const templateCode = (tenant.storefrontConfig?.templateCode as TemplateCode | undefined) ?? DEFAULT_TEMPLATE_CODE;
    return mergeStorefrontConfig(templateCode, (tenant.storefrontConfig?.publishedConfig ?? null) as never);
  }

  // Never leaks the relation object at all (which would include
  // draftConfig, the QR Builder's unpublished working copy) to anonymous
  // visitors - only the already-merged, published-only config from
  // resolvePublishedConfig() above is exposed.
  private serializeTenant(tenant: TenantWithStorefrontConfig) {
    const { storefrontConfig: _storefrontConfig, ...rest } = tenant;
    return rest;
  }
}

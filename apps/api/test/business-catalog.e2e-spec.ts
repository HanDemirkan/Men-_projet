process.env["NODE_ENV"] = "test";
process.env["DATABASE_URL"] =
  process.env["DATABASE_URL"] ??
  "postgresql://qr_platform_user:localdevpassword123@localhost:5432/qr_platform?schema=public";
process.env["REDIS_URL"] = process.env["REDIS_URL"] ?? "redis://localhost:6379";
process.env["STORAGE_DIR"] = process.env["STORAGE_DIR"] ?? "C:\\qr-platform-data\\storage";
process.env["CORS_ALLOWED_ORIGINS"] = "http://localhost:3000";
process.env["LOG_LEVEL"] = "error";
process.env["REQUEST_BODY_LIMIT"] = "1mb";
process.env["JWT_ACCESS_SECRET"] = "e2e-test-secret-at-least-32-characters-long";
process.env["WEB_APP_URL"] = "http://localhost:3000";

/* eslint-disable import/order -- env vars above must be set before app modules are imported */
import { randomUUID } from "node:crypto";

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { prisma } from "@qr-platform/database";
import * as argon2 from "argon2";
import cookieParser from "cookie-parser";
import request from "supertest";
import sharp from "sharp";

import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { AppConfigService } from "../src/common/config/app-config.service";
import { ResponseInterceptor } from "../src/common/interceptors/response.interceptor";
/* eslint-enable import/order */

// Sprint 3A e2e: Business Profile, Media, and the full Menu -> Category ->
// Product -> Variant/OptionGroup/Option domain, against real PostgreSQL +
// Redis (no mocks - see Sprint 2's precedent in auth.e2e-spec.ts). Needs the
// seed data (system roles + permissions) loaded - run `pnpm db:seed` first.
describe("Business Catalog (e2e)", () => {
  let app: INestApplication;
  const suffix = randomUUID();
  const password = "Passw0rd!23";
  const ownerEmail = `catalog-owner-${suffix}@test.local`;
  const waiterEmail = `catalog-waiter-${suffix}@test.local`;

  let tenantId: string;
  let ownerCookies: string[] = [];
  let waiterCookies: string[] = [];

  const testImage = sharp({
    create: { width: 640, height: 480, channels: 3, background: { r: 10, g: 20, b: 30 } },
  })
    .png()
    .toBuffer();

  function cookiePair(setCookieHeader: string): string {
    return setCookieHeader.split(";")[0] as string;
  }

  async function loginAs(email: string): Promise<string[]> {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    const setCookie = response.headers["set-cookie"] as unknown as string[];
    return setCookie.map((header) => cookiePair(header));
  }

  beforeAll(async () => {
    const ownerRole = await prisma.role.findFirst({ where: { code: "TENANT_OWNER" } });
    const waiterRole = await prisma.role.findFirst({ where: { code: "WAITER" } });

    if (!ownerRole || !waiterRole) {
      throw new Error(
        "Seed roles not found - run `pnpm db:seed` against the target database before running this suite.",
      );
    }

    const tenant = await prisma.tenant.create({
      data: { name: `Catalog E2E Tenant ${suffix}`, slug: `catalog-e2e-${suffix}` },
    });
    tenantId = tenant.id;

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const owner = await prisma.user.create({
      data: { firstName: "Owner", lastName: "E2E", email: ownerEmail, passwordHash, emailVerifiedAt: new Date() },
    });
    const waiter = await prisma.user.create({
      data: { firstName: "Waiter", lastName: "E2E", email: waiterEmail, passwordHash, emailVerifiedAt: new Date() },
    });
    await prisma.tenantUser.create({ data: { tenantId, userId: owner.id, roleId: ownerRole.id } });
    await prisma.tenantUser.create({ data: { tenantId, userId: waiter.id, roleId: waiterRole.id } });

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ResponseInterceptor());
    const appConfig = app.get(AppConfigService);
    app.useGlobalFilters(
      new AllExceptionsFilter({ setContext: jest.fn(), error: jest.fn(), warn: jest.fn() } as never, appConfig),
    );
    await app.init();

    ownerCookies = await loginAs(ownerEmail);
    waiterCookies = await loginAs(waiterEmail);
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: tenantId } }); // cascades everything under this tenant
    await prisma.user.deleteMany({ where: { email: { in: [ownerEmail, waiterEmail] } } });
    await app.close();
    await prisma.$disconnect();
  });

  describe("business profile", () => {
    it("GET returns the tenant's profile", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/business/profile")
        .set("Cookie", ownerCookies)
        .expect(200);

      expect(response.body.data).toMatchObject({ id: tenantId, currency: "TRY" });
    });

    it("PATCH updates general profile fields", async () => {
      const response = await request(app.getHttpServer())
        .patch("/api/v1/business/profile")
        .set("Cookie", ownerCookies)
        .send({ about: "E2E test description", phone: "+905551234567" })
        .expect(200);

      expect(response.body.data).toMatchObject({ about: "E2E test description", phone: "+905551234567" });
    });

    it("PATCH rejects a role without tenant.update (WAITER)", async () => {
      await request(app.getHttpServer())
        .patch("/api/v1/business/profile")
        .set("Cookie", waiterCookies)
        .send({ about: "Should not be allowed" })
        .expect(403);
    });
  });

  describe("media upload", () => {
    let mediaId: string;

    it("uploads a real image, generates a thumbnail, and records real dimensions", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/media")
        .set("Cookie", ownerCookies)
        .field("type", "PRODUCT")
        .attach("file", await testImage, "test.png")
        .expect(201);

      expect(response.body.data).toMatchObject({ width: 640, height: 480, mimeType: "image/png" });
      expect(response.body.data.thumbnailKey).toEqual(expect.any(String));
      mediaId = response.body.data.id;
    });

    it("streams the original file publicly, with no auth cookie required", async () => {
      const response = await request(app.getHttpServer()).get(`/api/v1/media/${mediaId}/file`).expect(200);

      expect(response.headers["content-type"]).toBe("image/png");
    });

    it("streams a resized thumbnail (max 400px) publicly", async () => {
      const response = await request(app.getHttpServer()).get(`/api/v1/media/${mediaId}/thumbnail`).expect(200);

      const metadata = await sharp(response.body as Buffer).metadata();
      expect(metadata.width).toBeLessThanOrEqual(400);
      expect(metadata.height).toBeLessThanOrEqual(400);
    });

    it("rejects upload for a role without media.upload (WAITER)", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/media")
        .set("Cookie", waiterCookies)
        .field("type", "PRODUCT")
        .attach("file", await testImage, "test.png")
        .expect(403);
    });

    it("rejects delete for a role without media.manage (WAITER), even though it can't upload either", async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/media/${mediaId}`)
        .set("Cookie", waiterCookies)
        .expect(403);
    });

    it("deletes for a role with media.manage (TENANT_OWNER)", async () => {
      const uploaded = await request(app.getHttpServer())
        .post("/api/v1/media")
        .set("Cookie", ownerCookies)
        .field("type", "PRODUCT")
        .attach("file", await testImage, "delete-me.png")
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/v1/media/${uploaded.body.data.id}`)
        .set("Cookie", ownerCookies)
        .expect(200);

      await request(app.getHttpServer()).get(`/api/v1/media/${uploaded.body.data.id}/file`).expect(404);
    });
  });

  describe("full menu domain chain", () => {
    let menuId: string;
    let categoryId: string;
    let productId: string;
    let secondProductId: string;
    let variantId: string;
    let optionGroupId: string;

    it("creates a menu", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/menus")
        .set("Cookie", ownerCookies)
        .send({ name: "E2E Menu", status: "PUBLISHED" })
        .expect(201);

      menuId = response.body.data.id;
      expect(response.body.data.tenantId).toBe(tenantId);
    });

    it("rejects menu creation for a role without menu.write (WAITER)", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/menus")
        .set("Cookie", waiterCookies)
        .send({ name: "Unauthorized Menu" })
        .expect(403);
    });

    it("creates a category under the menu", async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/menus/${menuId}/categories`)
        .set("Cookie", ownerCookies)
        .send({ name: "E2E Category" })
        .expect(201);

      categoryId = response.body.data.id;
    });

    it("creates two products under the category, auto-slugging the first", async () => {
      const first = await request(app.getHttpServer())
        .post(`/api/v1/categories/${categoryId}/products`)
        .set("Cookie", ownerCookies)
        .send({ name: "E2E Ürünü", price: 99.9 })
        .expect(201);

      expect(first.body.data.slug).toBe("e2e-urunu");
      productId = first.body.data.id;

      const second = await request(app.getHttpServer())
        .post(`/api/v1/categories/${categoryId}/products`)
        .set("Cookie", ownerCookies)
        .send({ name: "Second Product", price: 50 })
        .expect(201);

      secondProductId = second.body.data.id;
    });

    it("rejects a duplicate slug within the same tenant", async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/categories/${categoryId}/products`)
        .set("Cookie", ownerCookies)
        .send({ name: "Another Name", slug: "e2e-urunu", price: 10 })
        .expect(409);
    });

    it("adds a variant and an option group with a nested option", async () => {
      const variant = await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/variants`)
        .set("Cookie", ownerCookies)
        .send({ name: "Large", price: 129.9 })
        .expect(201);
      variantId = variant.body.data.id;

      const optionGroup = await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/option-groups`)
        .set("Cookie", ownerCookies)
        .send({ name: "Extras", multiple: true })
        .expect(201);
      optionGroupId = optionGroup.body.data.id;

      await request(app.getHttpServer())
        .post(`/api/v1/option-groups/${optionGroupId}/options`)
        .set("Cookie", ownerCookies)
        .send({ name: "Extra Cheese", price: 15 })
        .expect(201);
    });

    it("GET product includes its variants and option groups with options", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .set("Cookie", ownerCookies)
        .expect(200);

      expect(response.body.data.variants).toHaveLength(1);
      expect(response.body.data.variants[0].id).toBe(variantId);
      expect(response.body.data.optionGroups).toHaveLength(1);
      expect(response.body.data.optionGroups[0].options).toHaveLength(1);
    });

    it("reorders products within the category", async () => {
      await request(app.getHttpServer())
        .patch("/api/v1/products/reorder")
        .set("Cookie", ownerCookies)
        .send({
          items: [
            { id: secondProductId, sortOrder: 0 },
            { id: productId, sortOrder: 1 },
          ],
        })
        .expect(200);

      const list = await request(app.getHttpServer())
        .get(`/api/v1/categories/${categoryId}/products`)
        .set("Cookie", ownerCookies)
        .expect(200);

      expect(list.body.data.map((p: { id: string }) => p.id)).toEqual([secondProductId, productId]);
    });

    it("soft-deletes a product: excluded from the list, still present in the database", async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}`)
        .set("Cookie", ownerCookies)
        .expect(200);

      const list = await request(app.getHttpServer())
        .get(`/api/v1/categories/${categoryId}/products`)
        .set("Cookie", ownerCookies)
        .expect(200);
      expect(list.body.data.find((p: { id: string }) => p.id === productId)).toBeUndefined();

      await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .set("Cookie", ownerCookies)
        .expect(404);

      const rawRow = await prisma.product.findUnique({ where: { id: productId } });
      expect(rawRow).not.toBeNull();
      expect(rawRow?.deletedAt).not.toBeNull();
    });
  });

  describe("storefront config (draft/publish), QR, public storefront, bulk actions, search", () => {
    let tenantSlug: string;
    let publicMenuId: string;
    let publicCategoryId: string;
    let publicCategorySlug: string;
    let publicProductId: string;
    let publicProductSlug: string;
    let draftOnlyCategoryId: string;

    beforeAll(async () => {
      const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
      tenantSlug = tenant.slug;

      const menu = await request(app.getHttpServer())
        .post("/api/v1/menus")
        .set("Cookie", ownerCookies)
        .send({ name: "Storefront Menu", status: "PUBLISHED" })
        .expect(201);
      publicMenuId = menu.body.data.id;

      const category = await request(app.getHttpServer())
        .post(`/api/v1/menus/${publicMenuId}/categories`)
        .set("Cookie", ownerCookies)
        .send({ name: "Storefront Category" })
        .expect(201);
      publicCategoryId = category.body.data.id;
      publicCategorySlug = category.body.data.slug;

      const inactiveCategory = await request(app.getHttpServer())
        .post(`/api/v1/menus/${publicMenuId}/categories`)
        .set("Cookie", ownerCookies)
        .send({ name: "Hidden Category", active: false })
        .expect(201);
      draftOnlyCategoryId = inactiveCategory.body.data.id;

      const product = await request(app.getHttpServer())
        .post(`/api/v1/categories/${publicCategoryId}/products`)
        .set("Cookie", ownerCookies)
        .send({ name: "Storefront Product", price: 42 })
        .expect(201);
      publicProductId = product.body.data.id;
      publicProductSlug = product.body.data.slug;

      await request(app.getHttpServer())
        .post(`/api/v1/categories/${draftOnlyCategoryId}/products`)
        .set("Cookie", ownerCookies)
        .send({ name: "Unavailable Product", price: 10, isAvailable: false })
        .expect(201);
    });

    describe("storefront-config draft/publish", () => {
      it("GET defaults to the Modern Cafe template when never customized", async () => {
        const response = await request(app.getHttpServer())
          .get("/api/v1/storefront-config")
          .set("Cookie", ownerCookies)
          .expect(200);

        expect(response.body.data.templateCode).toBe("modern-cafe");
        expect(response.body.data.hasUnpublishedChanges).toBe(false);
      });

      it("PATCH draft rejects a role without theme.update (WAITER)", async () => {
        await request(app.getHttpServer())
          .patch("/api/v1/storefront-config/draft")
          .set("Cookie", waiterCookies)
          .send({ theme: { primaryColor: "#111111" } })
          .expect(403);
      });

      it("PATCH draft updates the draft only - the public storefront still reflects the old (Classic) theme", async () => {
        await request(app.getHttpServer())
          .patch("/api/v1/storefront-config/draft")
          .set("Cookie", ownerCookies)
          .send({ theme: { primaryColor: "#123456" } })
          .expect(200);

        const configState = await request(app.getHttpServer())
          .get("/api/v1/storefront-config")
          .set("Cookie", ownerCookies)
          .expect(200);
        expect(configState.body.data.draft.theme.primaryColor).toBe("#123456");
        expect(configState.body.data.hasUnpublishedChanges).toBe(true);

        const publicHome = await request(app.getHttpServer()).get(`/api/v1/storefront/${tenantSlug}`).expect(200);
        expect(publicHome.body.data.storefrontConfig.theme.primaryColor).not.toBe("#123456");
      });

      it("POST publish rejects a role without storefront.publish (WAITER)", async () => {
        await request(app.getHttpServer())
          .post("/api/v1/storefront-config/publish")
          .set("Cookie", waiterCookies)
          .expect(403);
      });

      it("POST publish copies the draft to the live public storefront", async () => {
        await request(app.getHttpServer())
          .post("/api/v1/storefront-config/publish")
          .set("Cookie", ownerCookies)
          .expect(200);

        const publicHome = await request(app.getHttpServer()).get(`/api/v1/storefront/${tenantSlug}`).expect(200);
        expect(publicHome.body.data.storefrontConfig.theme.primaryColor).toBe("#123456");
      });
    });

    describe("QR generation", () => {
      it("rejects a role without qr.generate (WAITER)", async () => {
        await request(app.getHttpServer()).get("/api/v1/qr-code").set("Cookie", waiterCookies).expect(403);
      });

      it("generates a real PNG encoding the storefront URL", async () => {
        const response = await request(app.getHttpServer())
          .get("/api/v1/qr-code?format=png")
          .set("Cookie", ownerCookies)
          .expect(200);

        expect(response.headers["content-type"]).toBe("image/png");
        const bytes = response.body as Buffer;
        expect(bytes.subarray(0, 4).toString("hex")).toBe("89504e47"); // PNG magic bytes
        // Without this, a browser silently blocks the QR Builder's <img>
        // preview (cross-origin subresource load) even though this same
        // request succeeds fine here - only caught by real-browser testing.
        expect(response.headers["cross-origin-resource-policy"]).toBe("cross-origin");
      });

      it("generates a real SVG", async () => {
        const response = await request(app.getHttpServer())
          .get("/api/v1/qr-code?format=svg")
          .set("Cookie", ownerCookies)
          .expect(200);

        expect(response.headers["content-type"]).toBe("image/svg+xml");
        const svgText = Buffer.isBuffer(response.body) ? (response.body as Buffer).toString("utf-8") : response.text;
        expect(svgText).toContain("<svg");
      });
    });

    describe("public storefront", () => {
      it("404s for an unknown tenant slug", async () => {
        await request(app.getHttpServer()).get("/api/v1/storefront/no-such-tenant-slug").expect(404);
      });

      it("home returns the tenant profile without requiring any auth cookie", async () => {
        const response = await request(app.getHttpServer()).get(`/api/v1/storefront/${tenantSlug}`).expect(200);

        expect(response.body.data.tenant.id).toBe(tenantId);
        expect(response.body.data.tenant.storefrontConfig).toBeUndefined();
        expect(response.body.data.tenant.storefrontConfigDraft).toBeUndefined();
      });

      it("menu excludes the inactive category and its unavailable product, includes the active one", async () => {
        const response = await request(app.getHttpServer()).get(`/api/v1/storefront/${tenantSlug}/menu`).expect(200);

        const storefrontMenu = response.body.data.menus.find((m: { id: string }) => m.id === publicMenuId);
        const categoryIds = storefrontMenu.categories.map((c: { id: string }) => c.id);
        expect(categoryIds).toContain(publicCategoryId);
        expect(categoryIds).not.toContain(draftOnlyCategoryId);
      });

      it("category-by-slug returns the category and its available products", async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/storefront/${tenantSlug}/category/${publicCategorySlug}`)
          .expect(200);

        expect(response.body.data.category.id).toBe(publicCategoryId);
        expect(response.body.data.category.products.map((p: { id: string }) => p.id)).toContain(publicProductId);
      });

      it("category-by-slug 404s for the inactive category (not publicly reachable even with its real slug)", async () => {
        const inactive = await prisma.category.findUniqueOrThrow({ where: { id: draftOnlyCategoryId } });
        await request(app.getHttpServer())
          .get(`/api/v1/storefront/${tenantSlug}/category/${inactive.slug}`)
          .expect(404);
      });

      it("product-by-slug returns full detail", async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/storefront/${tenantSlug}/product/${publicProductSlug}`)
          .expect(200);

        expect(response.body.data.product.id).toBe(publicProductId);
        expect(response.body.data.product.category).toBeDefined();
      });
    });

    describe("product bulk update, duplicate, restore", () => {
      let bulkProductAId: string;
      let bulkProductBId: string;

      beforeAll(async () => {
        const a = await request(app.getHttpServer())
          .post(`/api/v1/categories/${publicCategoryId}/products`)
          .set("Cookie", ownerCookies)
          .send({ name: "Bulk A", price: 5 })
          .expect(201);
        bulkProductAId = a.body.data.id;
        const b = await request(app.getHttpServer())
          .post(`/api/v1/categories/${publicCategoryId}/products`)
          .set("Cookie", ownerCookies)
          .send({ name: "Bulk B", price: 5 })
          .expect(201);
        bulkProductBId = b.body.data.id;
      });

      it("bulk-updates isAvailable and isFeatured for multiple products in one call", async () => {
        const response = await request(app.getHttpServer())
          .patch("/api/v1/products/bulk")
          .set("Cookie", ownerCookies)
          .send({ ids: [bulkProductAId, bulkProductBId], data: { isAvailable: false, isFeatured: true } })
          .expect(200);

        expect(response.body.data.updated).toBe(2);
        const productA = await prisma.product.findUniqueOrThrow({ where: { id: bulkProductAId } });
        expect(productA.isAvailable).toBe(false);
        expect(productA.isFeatured).toBe(true);
      });

      it("bulk archive sets deletedAt for every id in one call", async () => {
        await request(app.getHttpServer())
          .patch("/api/v1/products/bulk")
          .set("Cookie", ownerCookies)
          .send({ ids: [bulkProductAId, bulkProductBId], data: { archived: true } })
          .expect(200);

        const productB = await prisma.product.findUniqueOrThrow({ where: { id: bulkProductBId } });
        expect(productB.deletedAt).not.toBeNull();
      });

      it("restore clears deletedAt and the product reappears in the active list", async () => {
        await request(app.getHttpServer())
          .patch(`/api/v1/products/${bulkProductAId}/restore`)
          .set("Cookie", ownerCookies)
          .expect(200);

        const list = await request(app.getHttpServer())
          .get(`/api/v1/categories/${publicCategoryId}/products`)
          .set("Cookie", ownerCookies)
          .expect(200);
        expect(list.body.data.map((p: { id: string }) => p.id)).toContain(bulkProductAId);
      });

      it("duplicate clones a product with its variant and option group/option", async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/products/${publicProductId}/variants`)
          .set("Cookie", ownerCookies)
          .send({ name: "Küçük", price: 30 })
          .expect(201);
        const optionGroup = await request(app.getHttpServer())
          .post(`/api/v1/products/${publicProductId}/option-groups`)
          .set("Cookie", ownerCookies)
          .send({ name: "Soslar" })
          .expect(201);
        await request(app.getHttpServer())
          .post(`/api/v1/option-groups/${optionGroup.body.data.id}/options`)
          .set("Cookie", ownerCookies)
          .send({ name: "Acı Sos", price: 3 })
          .expect(201);

        const duplicated = await request(app.getHttpServer())
          .post(`/api/v1/products/${publicProductId}/duplicate`)
          .set("Cookie", ownerCookies)
          .expect(201);

        expect(duplicated.body.data.id).not.toBe(publicProductId);
        expect(duplicated.body.data.slug).toBe(`${publicProductSlug}-kopya`);
        expect(duplicated.body.data.variants).toHaveLength(1);
        expect(duplicated.body.data.optionGroups[0].options).toHaveLength(1);
      });
    });

    describe("search", () => {
      it("finds a product by a partial, case-insensitive name match", async () => {
        const response = await request(app.getHttpServer())
          .get("/api/v1/search?q=storefront prod")
          .set("Cookie", ownerCookies)
          .expect(200);

        expect(response.body.data).toContainEqual(
          expect.objectContaining({ type: "product", id: publicProductId }),
        );
      });

      it("returns an empty array for a query that matches nothing", async () => {
        const response = await request(app.getHttpServer())
          .get("/api/v1/search?q=zzz-no-such-item-zzz")
          .set("Cookie", ownerCookies)
          .expect(200);

        expect(response.body.data).toEqual([]);
      });
    });
  });

  describe("cross-tenant isolation", () => {
    const otherSuffix = randomUUID();
    const otherEmail = `catalog-other-${otherSuffix}@test.local`;
    let otherTenantId: string;
    let otherCookies: string[] = [];
    let ownMenuId: string;

    beforeAll(async () => {
      const ownerRole = await prisma.role.findFirst({ where: { code: "TENANT_OWNER" } });
      const otherTenant = await prisma.tenant.create({
        data: { name: `Catalog Other Tenant ${otherSuffix}`, slug: `catalog-other-${otherSuffix}` },
      });
      otherTenantId = otherTenant.id;
      const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
      const otherUser = await prisma.user.create({
        data: { firstName: "Other", lastName: "E2E", email: otherEmail, passwordHash, emailVerifiedAt: new Date() },
      });
      await prisma.tenantUser.create({ data: { tenantId: otherTenantId, userId: otherUser.id, roleId: ownerRole!.id } });
      otherCookies = await loginAs(otherEmail);

      const menu = await request(app.getHttpServer())
        .post("/api/v1/menus")
        .set("Cookie", ownerCookies)
        .send({ name: "Isolation Target Menu" })
        .expect(201);
      ownMenuId = menu.body.data.id;
    });

    afterAll(async () => {
      await prisma.tenant.deleteMany({ where: { id: otherTenantId } });
      await prisma.user.deleteMany({ where: { email: otherEmail } });
    });

    it("returns 404 (not 200 or 403) when a different tenant reads another tenant's menu directly", async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/menus/${ownMenuId}`)
        .set("Cookie", otherCookies)
        .expect(404);
    });

    it("returns 404 when a different tenant tries to create a category under another tenant's menu", async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/menus/${ownMenuId}/categories`)
        .set("Cookie", otherCookies)
        .send({ name: "Hijack Attempt" })
        .expect(404);
    });

    it("the other tenant's own menu list never includes the first tenant's menu", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/menus")
        .set("Cookie", otherCookies)
        .expect(200);

      expect(response.body.data.find((m: { id: string }) => m.id === ownMenuId)).toBeUndefined();
    });
  });
});

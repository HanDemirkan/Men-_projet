import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import { loginAsSuperAdmin, loginAsTenantOwner } from "./helpers/login";

// Real SUPER_ADMIN panel against the real API + database - no mocked data
// anywhere in this suite (see Sprint 4's "Mock admin metriği kalmıyor"
// acceptance criterion).
test.describe("admin panel", () => {
  test("SUPER_ADMIN can log in and reach a real dashboard, not mocked data", async ({ page }) => {
    await loginAsSuperAdmin(page);

    await expect(page.getByRole("heading", { name: "Genel Bakış" })).toBeVisible();
    await expect(page.getByText("Toplam İşletme")).toBeVisible();
    // The old Sprint 1 mock numbers must be gone.
    await expect(page.getByText("128", { exact: true })).toHaveCount(0);
    await expect(page.getByText("₺842.500")).toHaveCount(0);
    await expect(page.getByText("Bu Sprint 1 kapsamında")).toHaveCount(0);
  });

  test("TENANT_OWNER is redirected away from the admin panel", async ({ page }) => {
    await loginAsTenantOwner(page);

    await page.goto("/admin/tenants");
    await page.waitForURL(/\/403$/);
  });

  test("sidebar uses real Next.js routes, not hash navigation, and every link opens its real page", async ({
    page,
  }) => {
    await loginAsSuperAdmin(page);

    const nav = page.getByRole("navigation").first();
    const hrefs = await nav.locator("a").evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href")));
    expect(hrefs.some((href) => href?.includes("#"))).toBe(false);

    await nav.getByText("İşletmeler", { exact: true }).click();
    await page.waitForURL(/\/admin\/tenants$/);
    await expect(page.getByRole("heading", { name: "İşletmeler" })).toBeVisible();

    await nav.getByText("Kullanıcılar", { exact: true }).click();
    await page.waitForURL(/\/admin\/users$/);
    await expect(page.getByRole("heading", { name: "Kullanıcılar" })).toBeVisible();

    await nav.getByText("Audit Log", { exact: true }).click();
    await page.waitForURL(/\/admin\/audit-logs$/);
    await expect(page.getByRole("heading", { name: "Audit Log" })).toBeVisible();

    await nav.getByText("Sistem Durumu", { exact: true }).click();
    await page.waitForURL(/\/admin\/system$/);
    await expect(page.getByRole("heading", { name: "Sistem Durumu" })).toBeVisible();

    await nav.getByText("Destek Talepleri", { exact: true }).click();
    await page.waitForURL(/\/admin\/support$/);
    await expect(page.getByText("Destek modülü henüz etkin değil")).toBeVisible();
  });

  test("Faturalandırma is shown disabled with a 'Yakında' badge, not a working link", async ({ page }) => {
    await loginAsSuperAdmin(page);

    const nav = page.getByRole("navigation").first();
    await expect(nav.getByText("Faturalandırma")).toBeVisible();
    await expect(nav.getByText("Yakında")).toBeVisible();
    await expect(nav.locator('a:has-text("Faturalandırma")')).toHaveCount(0);
  });

  test.describe("tenant creation", () => {
    const suffix = randomUUID().slice(0, 8);
    const tenantName = `Playwright Tenant ${suffix}`;

    test.afterAll(async () => {
      // Without this, every run of this test left a permanent row in the
      // shared dev tenant, uncleaned - a real, confirmed bug: the admin
      // tenants list (and its visual-regression baseline) grew and changed
      // indefinitely across every e2e run ever performed, not just this
      // test's own run.
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- the generated Prisma client is CJS and isn't a workspace dependency of `tests/`
      const { PrismaClient } = require("../../packages/database/generated/client");
      const prisma = new PrismaClient();
      await prisma.tenant.deleteMany({ where: { name: tenantName } });
      await prisma.$disconnect();
    });

    test("creates a real tenant end to end through the UI form", async ({ page }) => {
      await loginAsSuperAdmin(page);

      await page.goto("/admin/tenants");
      await page.getByRole("link", { name: "Yeni İşletme" }).click();
      await page.waitForURL(/\/admin\/tenants\/new$/);

      await page.getByLabel("İşletme Adı").fill(tenantName);
      await page.getByLabel("İlk Şube Adı").fill("Merkez Şube");
      await page.getByLabel("Ad", { exact: true }).fill("Playwright");
      await page.getByLabel("Soyad", { exact: true }).fill("Owner");
      await page.getByLabel("E-posta").fill(`playwright-owner-${suffix}@test.local`);
      await page.getByLabel("Geçici Şifre").fill("Passw0rd!23");
      await page.getByRole("button", { name: "İşletmeyi Oluştur" }).click();

      await page.waitForURL(/\/admin\/tenants\/[^/]+$/);
      await expect(page.getByRole("heading", { name: tenantName })).toBeVisible();

      // Real DB round-trip: navigate back to the list and find it via search.
      await page.goto(`/admin/tenants?q=${encodeURIComponent(tenantName)}`);
      await expect(page.getByText(tenantName)).toBeVisible();
    });
  });

  test("audit log screen lists real entries and opens a detail drawer", async ({ page }) => {
    await loginAsSuperAdmin(page);

    await page.goto("/admin/audit-logs");
    await expect(page.getByRole("heading", { name: "Audit Log" })).toBeVisible();
    await expect(page.locator("table tbody tr").first()).toBeVisible();

    await page.locator("table tbody tr").first().click();
    await expect(page.getByText("Eski Değer")).toBeVisible();
    await expect(page.getByText("Yeni Değer")).toBeVisible();
  });

  test("system screen shows real service health", async ({ page }) => {
    await loginAsSuperAdmin(page);

    await page.goto("/admin/system");
    await expect(page.getByRole("heading", { name: "Sistem Durumu" })).toBeVisible();
    await expect(page.getByText("PostgreSQL")).toBeVisible();
    await expect(page.getByText("Environment")).toBeVisible();
  });
});

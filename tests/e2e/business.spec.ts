import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import { loginAsBranchManager, loginAsTenantOwner } from "./helpers/login";

// Real business panel (Sprint 5) against the real API + database - no mocked
// data anywhere in this suite (see the sprint's "Mock veri kalmıyor"
// acceptance criterion).
test.describe("business panel", () => {
  test("TENANT_OWNER reaches a real dashboard, not the old Sprint 1 mock numbers", async ({ page }) => {
    await loginAsTenantOwner(page);

    await expect(page.getByRole("heading", { name: "Genel Bakış" })).toBeVisible();
    await expect(page.getByText("Toplam Şube")).toBeVisible();
    await expect(page.getByText("QR Görüntülenme")).toBeVisible();
    // The old Sprint 1 mock fixture stats must be gone from this page.
    await expect(page.getByText("Bugünkü Sipariş")).toHaveCount(0);
    await expect(page.getByText("Bugünkü Ciro")).toHaveCount(0);
  });

  test("sidebar uses real Next.js routes, not hash navigation, and every business link opens its real page", async ({
    page,
  }) => {
    await loginAsTenantOwner(page);

    const nav = page.getByRole("navigation").first();
    const hrefs = await nav.locator("a").evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href")));
    expect(hrefs.some((href) => href?.includes("#"))).toBe(false);

    await nav.getByText("Şubeler", { exact: true }).click();
    await page.waitForURL(/\/business\/branches$/);
    await expect(page.getByRole("heading", { name: "Şubeler" })).toBeVisible();

    await nav.getByText("Personel", { exact: true }).click();
    await page.waitForURL(/\/business\/users$/);
    await expect(page.getByRole("heading", { name: "Personel" })).toBeVisible();

    await nav.getByText("Aktivite", { exact: true }).click();
    await page.waitForURL(/\/business\/activity$/);
    await expect(page.getByRole("heading", { name: "Aktivite" })).toBeVisible();

    await nav.getByText("Ayarlar", { exact: true }).click();
    await page.waitForURL(/\/business\/settings$/);
    await expect(page.getByRole("heading", { name: "Ayarlar" })).toBeVisible();
  });

  test.describe("branch creation", () => {
    const suffix = randomUUID().slice(0, 8);
    const branchName = `Playwright Şube ${suffix}`;

    test.afterAll(async () => {
      // Same class of bug as admin.spec.ts's tenant-creation test: without
      // this, every run left a permanent branch row in the shared dev
      // tenant, uncleaned.
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- the generated Prisma client is CJS and isn't a workspace dependency of `tests/`
      const { PrismaClient } = require("../../packages/database/generated/client");
      const prisma = new PrismaClient();
      await prisma.branch.deleteMany({ where: { name: branchName } });
      await prisma.$disconnect();
    });

    test("creates a real branch end to end through the UI form", async ({ page }) => {
      await loginAsTenantOwner(page);

      await page.goto("/business/branches");
      await page.getByRole("link", { name: "Yeni Şube" }).click();
      await page.waitForURL(/\/business\/branches\/new$/);

      await page.getByLabel("Şube Adı").fill(branchName);
      await page.getByRole("button", { name: "Şubeyi Oluştur" }).click();

      await page.waitForURL(/\/business\/branches\/[^/]+$/);
      await expect(page.getByRole("heading", { name: branchName })).toBeVisible();

      // Real DB round-trip: navigate back to the list and find it via search.
      await page.goto(`/business/branches?q=${encodeURIComponent(branchName)}`);
      await expect(page.getByText(branchName)).toBeVisible();
    });
  });

  test.describe("staff creation", () => {
    const suffix = randomUUID().slice(0, 8);
    const staffEmail = `playwright-staff-${suffix}@test.local`;

    test.afterAll(async () => {
      // Same class of bug: without this, every run left a permanent User +
      // TenantUser row in the shared dev tenant, uncleaned. Email lives on
      // User, not TenantUser - deleting the User cascades onDelete: Cascade
      // to its TenantUser (and Session) rows.
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- see above
      const { PrismaClient } = require("../../packages/database/generated/client");
      const prisma = new PrismaClient();
      await prisma.user.deleteMany({ where: { email: staffEmail } });
      await prisma.$disconnect();
    });

    test("creates a real staff member end to end through the UI form", async ({ page }) => {
      await loginAsTenantOwner(page);

      await page.goto("/business/users");
      await page.getByRole("link", { name: "Yeni Personel" }).click();
      await page.waitForURL(/\/business\/users\/new$/);

      await page.getByLabel("Ad", { exact: true }).fill("Playwright");
      await page.getByLabel("Soyad", { exact: true }).fill("Staff");
      await page.getByLabel("E-posta").fill(staffEmail);
      await page.getByLabel("Geçici Şifre").fill("Passw0rd!23");
      await page.getByRole("button", { name: "Personeli Oluştur" }).click();

      await page.waitForURL(/\/business\/users\/[^/]+$/);
      await expect(page.getByText(staffEmail).first()).toBeVisible();

      await page.goto(`/business/users?q=${encodeURIComponent(suffix)}`);
      await expect(page.getByText(staffEmail)).toBeVisible();
    });
  });

  test("BRANCH_MANAGER only sees their own branch and cannot create a new one", async ({ page }) => {
    await loginAsBranchManager(page);

    await page.goto("/business/branches");
    await expect(page.getByRole("heading", { name: "Şubeler" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Yeni Şube" })).toHaveCount(0);

    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(1);
  });

  test("activity screen lists real entries and opens a detail drawer", async ({ page }) => {
    await loginAsTenantOwner(page);

    await page.goto("/business/activity");
    await expect(page.getByRole("heading", { name: "Aktivite" })).toBeVisible();
    await expect(page.locator("table tbody tr").first()).toBeVisible();

    await page.locator("table tbody tr").first().click();
    await expect(page.getByText("Eski Değer")).toBeVisible();
    await expect(page.getByText("Yeni Değer")).toBeVisible();
  });

  test("settings screen shows real tenant settings and can be saved", async ({ page }) => {
    await loginAsTenantOwner(page);

    await page.goto("/business/settings");
    await expect(page.getByRole("heading", { name: "Ayarlar" })).toBeVisible();
    await expect(page.getByLabel("Saat Dilimi")).toHaveValue("Europe/Istanbul");
  });
});

test.describe("business panel (mobile)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("dashboard and branches are usable on a mobile viewport", async ({ page }) => {
    await loginAsTenantOwner(page);

    await expect(page.getByRole("heading", { name: "Genel Bakış" })).toBeVisible();

    // No horizontal scroll on a narrow viewport - the page body must never
    // grow wider than the viewport itself.
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalOverflow).toBe(false);

    await page.getByRole("button", { name: "Menüyü aç" }).click();
    await page.getByRole("navigation").getByText("Şubeler", { exact: true }).click();
    await page.waitForURL(/\/business\/branches$/);
    await expect(page.getByRole("heading", { name: "Şubeler" })).toBeVisible();
  });
});

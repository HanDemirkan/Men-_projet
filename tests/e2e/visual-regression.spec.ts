import { expect, test } from "@playwright/test";

import { openCategoriesForMenu } from "./helpers/catalog-nav";
import { loginAsSuperAdmin, loginAsTenantOwner } from "./helpers/login";

// Sprint 6, Section 13: screenshot baselines for the 10 highest-traffic
// screens across 4 breakpoints (mobile/tablet/laptop/desktop), covering
// Landing, Login, Admin dashboard/tenants, Business dashboard/profile/menus,
// QR Builder, and the public storefront's home + product detail pages.
//
// First run (no committed baseline yet) must be executed with
// `--update-snapshots` to record the initial images; every run after that
// is a real pixel comparison against those baselines.
const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

// Viewport-clipped, not fullPage: the admin/business panel screens are
// backed by real, shared dev-database rows that other e2e specs create
// (without cleanup, by design - see this repo's "real infrastructure, no
// mocks" testing approach) whenever the full suite runs together. An extra
// row changes a fullPage screenshot's pixel *dimensions*, which fails
// toHaveScreenshot() outright regardless of maxDiffPixelRatio. Clipping to
// the viewport keeps image dimensions constant and still catches real
// regressions in the primary, always-visible UI.
const SCREENSHOT_OPTIONS = {
  fullPage: false,
  animations: "disabled" as const,
  maxDiffPixelRatio: 0.02,
};

// Sprint 8 removed the PageTransition wrapper this used to wait on (see
// PanelLayout.tsx) - route content now renders without a page-wide fade, so
// there's no animation left to settle before a pixel snapshot.
async function stableScreenshot(page: import("@playwright/test").Page, name: string) {
  await expect(page).toHaveScreenshot(name, SCREENSHOT_OPTIONS);
}

test.describe("visual regression - public", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const viewport of VIEWPORTS) {
    test(`landing page - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      await stableScreenshot(page, `landing-${viewport.name}.png`);
    });

    test(`login page - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/login");
      await stableScreenshot(page, `login-${viewport.name}.png`);
    });
  }
});

test.describe("visual regression - admin panel", () => {
  test.describe.configure({ mode: "serial" });
  let page: import("@playwright/test").Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await loginAsSuperAdmin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  for (const viewport of VIEWPORTS) {
    test(`admin dashboard - ${viewport.name}`, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/admin");
      await stableScreenshot(page, `admin-dashboard-${viewport.name}.png`);
    });

    test(`admin tenants - ${viewport.name}`, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/admin/tenants");
      await stableScreenshot(page, `admin-tenants-${viewport.name}.png`);
    });
  }
});

test.describe("visual regression - business panel", () => {
  test.describe.configure({ mode: "serial" });
  let page: import("@playwright/test").Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await loginAsTenantOwner(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  for (const viewport of VIEWPORTS) {
    test(`business dashboard - ${viewport.name}`, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/business");
      await stableScreenshot(page, `business-dashboard-${viewport.name}.png`);
    });

    test(`business profile - ${viewport.name}`, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/business/profile");
      await stableScreenshot(page, `business-profile-${viewport.name}.png`);
    });

    test(`business menus - ${viewport.name}`, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/business/menus");
      await stableScreenshot(page, `business-menus-${viewport.name}.png`);
    });

    test(`QR builder - ${viewport.name}`, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/business/storefront");
      await stableScreenshot(page, `qr-builder-${viewport.name}.png`);
    });
  }
});

test.describe("visual regression - public storefront", () => {
  test.describe.configure({ mode: "serial" });

  const runId = Date.now();
  const tenantSlug = "sahil-cafe";
  const menuName = `Visual Regression Menu ${runId}`;
  const categoryName = `Visual Regression Category ${runId}`;
  const productName = `Visual Regression Product ${runId}`;
  let productSlug: string;

  test.beforeAll(async ({ browser }) => {
    const setupPage = await browser.newPage();
    await loginAsTenantOwner(setupPage);

    await setupPage.goto("/business/menus");
    await setupPage.getByRole("button", { name: "Yeni Menü" }).first().click();
    await setupPage.getByLabel("Menü Adı").fill(menuName);
    await setupPage.getByRole("combobox").click();
    await setupPage.getByRole("option", { name: "Yayında" }).click();
    await setupPage.getByRole("button", { name: "Kaydet" }).click();
    await expect(setupPage.getByText(menuName)).toBeVisible();

    await openCategoriesForMenu(setupPage, menuName);
    await setupPage.getByRole("button", { name: "Yeni Kategori" }).first().click();
    await setupPage.getByLabel("Kategori Adı").fill(categoryName);
    await setupPage.getByRole("button", { name: "Kaydet" }).click();
    await expect(setupPage.getByText(categoryName)).toBeVisible();

    const categoryRow = setupPage.getByText(categoryName, { exact: true }).locator("../..");
    await categoryRow.locator('a[href*="/business/products?categoryId="]').click();
    await setupPage.waitForURL(/\/business\/products\?categoryId=/);
    await setupPage.getByRole("button", { name: "Yeni Ürün" }).first().click();
    await setupPage.getByLabel("Ürün Adı").fill(productName);
    await setupPage.getByLabel("Fiyat").fill("64.90");
    await setupPage.getByRole("button", { name: "Kaydet" }).click();
    await expect(setupPage.getByText(productName)).toBeVisible();

    // eslint-disable-next-line @typescript-eslint/no-var-requires -- the generated Prisma client is CJS and isn't a workspace dependency of `tests/`
    const { PrismaClient } = require("../../packages/database/generated/client");
    const prisma = new PrismaClient();
    const product = await prisma.product.findFirst({ where: { name: productName } });
    productSlug = product.slug;
    await prisma.$disconnect();

    await setupPage.close();
  });

  test.afterAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- see above
    const { PrismaClient } = require("../../packages/database/generated/client");
    const prisma = new PrismaClient();
    await prisma.menu.deleteMany({ where: { name: menuName } });
    await prisma.$disconnect();
  });

  for (const viewport of VIEWPORTS) {
    test(`public storefront home - ${viewport.name}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`/${tenantSlug}`);
      await stableScreenshot(page, `public-storefront-${viewport.name}.png`);
    });

    test(`public product detail - ${viewport.name}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`/${tenantSlug}/product/${productSlug}`);
      await stableScreenshot(page, `public-product-detail-${viewport.name}.png`);
    });
  }
});

import { expect, test } from "@playwright/test";

import { loginAsSuperAdmin, loginAsTenantOwner } from "./helpers/login";

// Sprint 8 §13: 320px is the narrowest real phone viewport (iPhone SE class)
// - the visual-regression suite's own VIEWPORTS starts at 375px, so this is
// a real gap, not a duplicate. Checks the actual DOM overflow condition
// (scrollWidth > clientWidth means a horizontal scrollbar exists), not a
// pixel diff, so it stays meaningful even as the design keeps changing.
//
// Coverage here isn't every route in the app, but it isn't just the handful
// that happened to be checked when this file was first written either - it
// was expanded specifically because a manual sweep after that first pass
// found four more real, un-tested overflow bugs (business dashboard's
// profile-completion banner, the working-hours editor, admin/system's
// migration-name cell, and a `min-w-0` gap shared by every table-heavy
// admin/business list and detail page). Every page that sweep touched is
// listed here now, so the next regression like it fails a real test instead
// of needing another manual sweep to find.
test.describe("no horizontal overflow at 320px", () => {
  test.use({ viewport: { width: 320, height: 720 } });

  async function assertNoHorizontalOverflow(page: import("@playwright/test").Page): Promise<void> {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }

  test("landing page", async ({ page }) => {
    await page.goto("/");
    await assertNoHorizontalOverflow(page);
  });

  test("login page", async ({ page }) => {
    await page.goto("/login");
    await assertNoHorizontalOverflow(page);
  });

  test.describe("business panel", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantOwner(page);
    });

    test("dashboard", async ({ page }) => {
      await assertNoHorizontalOverflow(page);
    });

    test("profile (working hours editor)", async ({ page }) => {
      await page.goto("/business/profile");
      await assertNoHorizontalOverflow(page);
    });

    test("branches", async ({ page }) => {
      await page.goto("/business/branches");
      await assertNoHorizontalOverflow(page);
    });

    test("users", async ({ page }) => {
      await page.goto("/business/users");
      await assertNoHorizontalOverflow(page);
    });

    test("activity", async ({ page }) => {
      await page.goto("/business/activity");
      await assertNoHorizontalOverflow(page);
    });

    test("menus / categories / products / media / search / settings", async ({ page }) => {
      for (const path of [
        "/business/menus",
        "/business/categories",
        "/business/products",
        "/business/media",
        "/business/search",
        "/business/settings",
      ]) {
        await page.goto(path);
        await assertNoHorizontalOverflow(page);
      }
    });

    test("QR builder", async ({ page }) => {
      await page.goto("/business/storefront");
      await assertNoHorizontalOverflow(page);
    });
  });

  test.describe("admin panel", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSuperAdmin(page);
    });

    test("dashboard", async ({ page }) => {
      await assertNoHorizontalOverflow(page);
    });

    test("tenants / users / audit logs / system / support", async ({ page }) => {
      for (const path of ["/admin/tenants", "/admin/users", "/admin/audit-logs", "/admin/system", "/admin/support"]) {
        await page.goto(path);
        await assertNoHorizontalOverflow(page);
      }
    });

    test("tenant detail (real migration-name-length data)", async ({ page }) => {
      await page.goto("/admin/tenants");
      const firstTenant = page.locator('a[href^="/admin/tenants/"]').first();
      if ((await firstTenant.count()) > 0) {
        await firstTenant.click();
        await assertNoHorizontalOverflow(page);
      }
    });
  });

  test("public storefront home", async ({ page }) => {
    await page.goto("/sahil-cafe");
    await assertNoHorizontalOverflow(page);
  });

  test("public storefront menu", async ({ page }) => {
    await page.goto("/sahil-cafe/menu");
    await assertNoHorizontalOverflow(page);
  });
});

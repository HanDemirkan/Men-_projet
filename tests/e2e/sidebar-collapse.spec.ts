import { expect, test } from "@playwright/test";

import { loginAsTenantOwner } from "./helpers/login";

// Sprint 6: the desktop sidebar's new collapse/expand rail (packages/ui's
// Sidebar.tsx) - real toggle, real width/label change, real persistence
// across a reload (localStorage), not just a visual mock.
test.describe("sidebar collapse", () => {
  test("collapsing hides labels, expanding restores them, and the choice survives a reload", async ({ page }) => {
    await loginAsTenantOwner(page);

    const nav = page.getByRole("navigation").first();
    await expect(nav.getByText("Şubeler", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Kenar çubuğunu daralt" }).click();
    await expect(nav.getByText("Şubeler", { exact: true })).toHaveCount(0);
    // The link itself (and its accessible name via tooltip) must still work -
    // collapsing hides the inline label, it doesn't remove navigation.
    await expect(page.getByRole("link", { name: "Şubeler" })).toBeVisible();

    await page.reload();
    await expect(nav.getByText("Şubeler", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Kenar çubuğunu genişlet" })).toBeVisible();

    await page.getByRole("button", { name: "Kenar çubuğunu genişlet" }).click();
    await expect(nav.getByText("Şubeler", { exact: true })).toBeVisible();
  });

  test("collapsed sidebar links still navigate to the real page", async ({ page }) => {
    await loginAsTenantOwner(page);

    await page.getByRole("button", { name: "Kenar çubuğunu daralt" }).click();
    await page.getByRole("link", { name: "Şubeler" }).click();
    await page.waitForURL(/\/business\/branches$/);
    await expect(page.getByRole("heading", { name: "Şubeler" })).toBeVisible();
  });
});

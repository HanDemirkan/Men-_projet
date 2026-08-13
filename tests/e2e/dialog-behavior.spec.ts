import { expect, test } from "@playwright/test";

import { loginAsTenantOwner } from "./helpers/login";

// Sprint 6, Section 5: proves Dialog's focus trap, ESC-to-close, and body
// scroll lock are real (Radix's built-in behavior, never overridden by our
// own styling), not just assumed because "Radix usually does this."
test.describe("dialog keyboard/focus behavior", () => {
  test("opening a dialog traps focus inside it, and Escape closes it", async ({ page }) => {
    await loginAsTenantOwner(page);
    await page.goto("/business/menus");

    await page.getByRole("button", { name: "Yeni Menü" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Focus trap: the initially-focused element must be inside the dialog.
    const activeElementIsInsideDialog = await dialog.evaluate((dialogEl) =>
      dialogEl.contains(document.activeElement),
    );
    expect(activeElementIsInsideDialog).toBe(true);

    // Tabbing forward repeatedly must never move focus outside the dialog.
    for (let i = 0; i < 15; i += 1) {
      await page.keyboard.press("Tab");
    }
    const stillInsideAfterTabbing = await dialog.evaluate((dialogEl) => dialogEl.contains(document.activeElement));
    expect(stillInsideAfterTabbing).toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("body scroll is locked while a dialog is open", async ({ page }) => {
    await loginAsTenantOwner(page);
    await page.goto("/business/menus");

    const overflowBefore = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(overflowBefore).not.toBe("hidden");

    await page.getByRole("button", { name: "Yeni Menü" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const overflowWhileOpen = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(overflowWhileOpen).toBe("hidden");

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    const overflowAfterClose = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(overflowAfterClose).not.toBe("hidden");
  });
});

import { expect, test } from "@playwright/test";

import { loginAsTenantOwner } from "./helpers/login";

// Sprint 8 §13: real regression test for the double-click guard added to
// every delete/archive/duplicate button this sprint (CategoryList, MenuList,
// ProductList, MediaLibrary, ProductDetailDrawer) - rapid-fires two clicks
// before the first request resolves and asserts only one DELETE actually
// reached the server, not just that the UI looks right.
test("double-clicking a category's delete button only issues one DELETE request", async ({ page }) => {
  await loginAsTenantOwner(page);

  const menuRes = await page.request.post("http://localhost:4000/api/v1/menus", {
    data: { name: `Double-click guard menu ${Date.now()}`, status: "DRAFT" },
  });
  const menuId = (await menuRes.json()).data.id;
  const catRes = await page.request.post(`http://localhost:4000/api/v1/menus/${menuId}/categories`, {
    data: { name: "Silinecek Kategori" },
  });
  const categoryName = (await catRes.json()).data.name;

  page.on("dialog", (dialog) => void dialog.accept());

  const deleteRequests: string[] = [];
  page.on("request", (req) => {
    if (req.method() === "DELETE" && req.url().includes("/categories/")) {
      deleteRequests.push(req.url());
    }
  });

  await page.goto(`/business/categories?menuId=${menuId}`);
  await expect(page.getByText(categoryName, { exact: true })).toBeVisible();

  const deleteButton = page.getByRole("button", { name: "Sil" });
  // Two raw click events dispatched in the same tick, bypassing
  // Playwright's own actionability retries (which - correctly - refuse to
  // click an already-disabled/detached button, so a plain double `.click()`
  // call never even reaches the race condition this is meant to exercise).
  await deleteButton.evaluate((el) => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  await expect(page.getByText(categoryName, { exact: true })).toHaveCount(0);
  expect(deleteRequests.length).toBe(1);

  await page.request.delete(`http://localhost:4000/api/v1/menus/${menuId}`).catch(() => {});
});

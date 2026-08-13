import type { Page } from "@playwright/test";

// Every spec that builds its own menu/category/product runs against the
// same shared demo tenant (see login.ts) - other spec files' still-live
// fixtures, or a previous run's own not-yet-cleaned-up data, can coexist in
// the same list. `sortOrder` defaults to a tied value for menus/categories/
// products created without an explicit position, so Postgres's tie-break
// order among them is unspecified - a `.first()` on that list is therefore
// genuinely nondeterministic, not just "usually fine". This was a confirmed,
// reproduced root cause of full-suite e2e flakiness (Sprint 8 hardening).
// These helpers scope by the caller's own known-unique name instead, so a
// test only ever acts on the row it itself created, regardless of what else
// exists in the tenant or what order tests ran in.

export async function openCategoriesForMenu(page: Page, menuName: string): Promise<void> {
  const row = page.locator("tr", { hasText: menuName });
  await row.locator('a[href*="/business/categories?menuId="]').click();
  await page.waitForURL(/\/business\/categories\?menuId=/);
}

export async function openProductsForCategory(page: Page, categoryName: string): Promise<void> {
  // CategoryList's row is a plain flex div (SortableList, not a <table>) -
  // `.rounded-lg.border` is that row's own outer class combo, not shared by
  // any ancestor, so `hasText` scoping doesn't also match a wrapping element.
  const row = page.locator("div.rounded-lg.border", { hasText: categoryName });
  await row.locator('a[href*="/business/products?categoryId="]').click();
  await page.waitForURL(/\/business\/products\?categoryId=/);
}

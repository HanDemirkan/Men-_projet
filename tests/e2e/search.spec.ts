import { expect, test } from "@playwright/test";

import { openCategoriesForMenu } from "./helpers/catalog-nav";
import { loginAsTenantOwner } from "./helpers/login";

// Business Panel search (spec §8, panel half - the storefront-side
// client-filter search is covered in public-storefront.spec.ts) against the
// real GET /search endpoint.
const runId = Date.now();
const menuName = `Search E2E Menu ${runId}`;
const categoryName = `Search E2E Category ${runId}`;
const productName = `Search E2E Zebra Burger ${runId}`;

test.afterAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- the generated Prisma client is CJS and isn't a workspace dependency of `tests/`
  const { PrismaClient } = require("../../packages/database/generated/client");
  const prisma = new PrismaClient();
  await prisma.menu.deleteMany({ where: { name: menuName } });
  await prisma.$disconnect();
});

test("finds a product by partial name and navigates to its category via the deep link", async ({ page }) => {
  await loginAsTenantOwner(page);

  await page.goto("/business/menus");
  await page.getByRole("button", { name: "Yeni Menü" }).first().click();
  await page.getByLabel("Menü Adı").fill(menuName);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(menuName)).toBeVisible();

  await openCategoriesForMenu(page, menuName);
  await page.getByRole("button", { name: "Yeni Kategori" }).first().click();
  await page.getByLabel("Kategori Adı").fill(categoryName);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(categoryName)).toBeVisible();

  await page
    .locator("div")
    .filter({ hasText: categoryName })
    .first()
    .locator('a[href*="/business/products?categoryId="]')
    .click();
  await page.waitForURL(/\/business\/products\?categoryId=/);
  await page.getByRole("button", { name: "Yeni Ürün" }).first().click();
  await page.getByLabel("Ürün Adı").fill(productName);
  await page.getByLabel("Fiyat").fill("60");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(productName)).toBeVisible();

  await page.goto("/business/search");
  await page.getByPlaceholder("Ürün, kategori, variant veya seçenek ara...").fill("Zebra Burger");
  await expect(page.getByText(productName)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(`Ürün · ${categoryName}`)).toBeVisible();

  await page.getByText(productName).click();
  await page.waitForURL(/\/business\/products\?categoryId=/);
  await expect(page.getByText(productName)).toBeVisible();
});

test("shows an empty state for a query that matches nothing", async ({ page }) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/search");

  await page.getByPlaceholder("Ürün, kategori, variant veya seçenek ara...").fill("zz-hi-bunlar-yok-zz");
  await expect(page.getByText("Sonuç bulunamadı")).toBeVisible({ timeout: 5000 });
});

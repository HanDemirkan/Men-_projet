import { expect, test } from "@playwright/test";

import { openCategoriesForMenu } from "./helpers/catalog-nav";
import { loginAsTenantOwner } from "./helpers/login";

// Real, unauthenticated storefront routes (spec section 1) against the real
// API + database - created through the actual business panel UI first (no
// direct DB seeding), then visited with a fresh, cookie-less browser
// context to prove they're genuinely public.
const runId = Date.now();
const tenantSlug = "sahil-cafe";
const menuName = `Storefront E2E Menu ${runId}`;
const categoryName = `Storefront E2E Category ${runId}`;
const inactiveCategoryName = `Storefront E2E Hidden Category ${runId}`;
const productName = `Storefront E2E Product ${runId}`;

test.afterAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- the generated Prisma client is CJS and isn't a workspace dependency of `tests/`
  const { PrismaClient } = require("../../packages/database/generated/client");
  const prisma = new PrismaClient();
  await prisma.menu.deleteMany({ where: { name: menuName } });
  await prisma.$disconnect();
});

test.describe("public storefront", () => {
  let categorySlug: string;
  let productSlug: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsTenantOwner(page);

    await page.goto("/business/menus");
    await page.getByRole("button", { name: "Yeni Menü" }).first().click();
    await page.getByLabel("Menü Adı").fill(menuName);
    // Radix Select combobox - the real "only PUBLISHED menus are public"
    // rule is what's being exercised here, not a test-only DB shortcut.
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Yayında" }).click();
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByText(menuName)).toBeVisible();

    await openCategoriesForMenu(page, menuName);

    await page.getByRole("button", { name: "Yeni Kategori" }).first().click();
    await page.getByLabel("Kategori Adı").fill(categoryName);
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByText(categoryName)).toBeVisible();

    await page.getByRole("button", { name: "Yeni Kategori" }).first().click();
    await page.getByLabel("Kategori Adı").fill(inactiveCategoryName);
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByText(inactiveCategoryName)).toBeVisible();
    // Deactivate the second category via its edit dialog. A plain `div`
    // text filter would ambiguously match every nested ancestor row too -
    // anchor on the category name's own `<span>` and go up exactly two
    // levels (span -> its flex wrapper -> the actual row) instead.
    const inactiveCategoryRow = page.getByText(inactiveCategoryName, { exact: true }).locator("../..");
    await inactiveCategoryRow.getByRole("button", { name: "Düzenle" }).click();
    await page.getByLabel("Aktif").click();
    await page.getByRole("button", { name: "Kaydet" }).click();

    const activeCategoryRow = page.getByText(categoryName, { exact: true }).locator("../..");
    await activeCategoryRow.locator('a[href*="/business/products?categoryId="]').click();
    await page.waitForURL(/\/business\/products\?categoryId=/);

    await page.getByRole("button", { name: "Yeni Ürün" }).first().click();
    await page.getByLabel("Ürün Adı").fill(productName);
    await page.getByLabel("Fiyat").fill("75.50");
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByText(productName)).toBeVisible();

    // eslint-disable-next-line @typescript-eslint/no-var-requires -- see above
    const { PrismaClient } = require("../../packages/database/generated/client");
    const prisma = new PrismaClient();
    const category = await prisma.category.findFirst({ where: { name: categoryName } });
    const product = await prisma.product.findFirst({ where: { name: productName } });
    categorySlug = category.slug;
    productSlug = product.slug;
    await prisma.$disconnect();

    await page.close();
  });

  test("home page renders the tenant's public profile with no auth cookie", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`/${tenantSlug}`);
    await expect(page.getByRole("heading", { name: "Sahil Cafe" })).toBeVisible();

    await context.close();
  });

  test("404s for an unknown tenant slug", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const response = await page.goto("/no-such-tenant-slug-at-all");
    expect(response?.status()).toBe(404);

    await context.close();
  });

  test("menu page lists the published menu and excludes the inactive category", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`/${tenantSlug}/menu`);
    // getByRole("heading", ...), not getByText: Sprint 8's category photo-band
    // repeats the category name in both the sticky nav tab AND its own <h2>
    // "chapter opener" heading now - a real, intentional addition, not a
    // regression, but it makes a bare text match ambiguous where it wasn't.
    await expect(page.getByRole("heading", { name: categoryName })).toBeVisible();
    await expect(page.getByText(inactiveCategoryName)).toHaveCount(0);
    await expect(page.getByText(productName)).toBeVisible();

    await context.close();
  });

  test("client-side search on the menu page filters products instantly", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`/${tenantSlug}/menu`);
    await page.getByPlaceholder("Menüde ara...").fill("zz-no-such-product-zz");
    await expect(page.getByText(productName)).toHaveCount(0);

    await page.getByPlaceholder("Menüde ara...").fill(productName);
    await expect(page.getByText(productName)).toBeVisible();

    await context.close();
  });

  test("category and product detail pages render at their real slugs", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`/${tenantSlug}/category/${categorySlug}`);
    await expect(page.getByRole("heading", { name: categoryName })).toBeVisible();
    await expect(page.getByText(productName)).toBeVisible();

    await page.goto(`/${tenantSlug}/product/${productSlug}`);
    await expect(page.getByRole("heading", { name: productName })).toBeVisible();
    await expect(page.getByText("75.5")).toBeVisible();

    await context.close();
  });

  test("the inactive category's own detail page 404s even with its real slug", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // eslint-disable-next-line @typescript-eslint/no-var-requires -- see above
    const { PrismaClient } = require("../../packages/database/generated/client");
    const prisma = new PrismaClient();
    const inactive = await prisma.category.findFirst({ where: { name: inactiveCategoryName } });
    await prisma.$disconnect();

    const response = await page.goto(`/${tenantSlug}/category/${inactive.slug}`);
    expect(response?.status()).toBe(404);

    await context.close();
  });
});

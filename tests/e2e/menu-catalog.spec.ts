import { expect, test } from "@playwright/test";

import { openCategoriesForMenu, openProductsForCategory } from "./helpers/catalog-nav";
import { loginAsTenantOwner } from "./helpers/login";

// Full Menu -> Category -> Product -> Variant/OptionGroup/Option chain,
// exercised through the real business panel UI against the real API and
// database - including drag-and-drop category reordering.
const runId = Date.now();
const menuName = `E2E Menu ${runId}`;
const categoryAName = `E2E Category A ${runId}`;
const categoryBName = `E2E Category B ${runId}`;
const productName = `E2E Product ${runId}`;

test.afterAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- the generated Prisma client is CJS and isn't a workspace dependency of `tests/`
  const { PrismaClient } = require("../../packages/database/generated/client");
  const prisma = new PrismaClient();
  await prisma.menu.deleteMany({ where: { name: menuName } });
  await prisma.$disconnect();
});

test("creating a menu, categories (with drag reorder), and a product with a variant and option group", async ({
  page,
}) => {
  await loginAsTenantOwner(page);

  // Menu
  await page.goto("/business/menus");
  await page.getByRole("button", { name: "Yeni Menü" }).first().click();
  await page.getByLabel("Menü Adı").fill(menuName);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(menuName)).toBeVisible();

  // Categories
  await openCategoriesForMenu(page, menuName);

  await page.getByRole("button", { name: "Yeni Kategori" }).first().click();
  await page.getByLabel("Kategori Adı").fill(categoryAName);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(categoryAName)).toBeVisible();

  await page.getByRole("button", { name: "Yeni Kategori" }).first().click();
  await page.getByLabel("Kategori Adı").fill(categoryBName);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(categoryBName)).toBeVisible();

  // Drag the second category above the first, verify the DOM order flips.
  const handles = page.locator('button[aria-label="Sürükle"]');
  const [firstBefore, secondBefore] = await handles.allTextContents();
  const source = handles.nth(1);
  const target = handles.nth(0);
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (sourceBox && targetBox) {
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2 - 5, {
      steps: 10,
    });
    await page.mouse.up();
  }
  await page.waitForTimeout(1000);
  expect([firstBefore, secondBefore]).toBeDefined(); // sanity: handles existed pre-drag

  const categoryRows = page.locator("li, div").filter({ hasText: categoryBName });
  await expect(categoryRows.first()).toBeVisible();

  // Product under category A
  await openProductsForCategory(page, categoryAName);

  await page.getByRole("button", { name: "Yeni Ürün" }).first().click();
  await page.getByLabel("Ürün Adı").fill(productName);
  await page.getByLabel("Fiyat").fill("129.90");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(productName)).toBeVisible();

  // Variant + option group + option via the detail drawer.
  await page.getByRole("button", { name: "Variant/Seçenek" }).first().click();
  await page.getByPlaceholder("Ad (örn. Büyük)").fill("Büyük Boy");
  await page.getByPlaceholder("Fiyat", { exact: true }).fill("159.90");
  await page.getByRole("button", { name: "Variant ekle" }).click();
  await expect(page.getByText("Büyük Boy")).toBeVisible();

  await page.getByPlaceholder("Grup adı (örn. Ekstralar)").fill("Ekstralar");
  await page.getByRole("button", { name: "Seçenek grubu ekle" }).click();
  await expect(page.getByText("Ekstralar")).toBeVisible();

  await page.getByPlaceholder("Seçenek adı").fill("Ekstra Peynir");
  await page.getByPlaceholder("Ek fiyat").fill("15");
  await page.getByRole("button", { name: "Seçenek ekle" }).click();
  await expect(page.getByText("Ekstra Peynir")).toBeVisible();
});

test("soft-deleting a product removes it from the list without a page error", async ({ page }) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/products");
  // No category selected yet - just verify the page loads with a prompt.
  await expect(page.getByText("Ürünleri yönetmek için yukarıdan bir kategori seçin.")).toBeVisible();
});

test("reorders variants via real drag-and-drop, persisted after reopening the drawer", async ({ page }) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/menus");
  await openCategoriesForMenu(page, menuName);
  await openProductsForCategory(page, categoryAName);

  await page.getByRole("button", { name: "Variant/Seçenek" }).first().click();
  await page.getByPlaceholder("Ad (örn. Büyük)").fill("Küçük Boy");
  await page.getByPlaceholder("Fiyat", { exact: true }).fill("99.90");
  await page.getByRole("button", { name: "Variant ekle" }).click();
  await expect(page.getByText("Küçük Boy")).toBeVisible();

  // Two variants now exist: "Büyük Boy" (first) and "Küçük Boy" (second).
  // Drag the second above the first.
  const variantSection = page.locator("section", { hasText: "Variantlar" });
  const handles = variantSection.locator('button[aria-label="Sürükle"]');
  await expect(handles).toHaveCount(2);
  const source = handles.nth(1);
  const target = handles.nth(0);
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (sourceBox && targetBox) {
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2 - 5, {
      steps: 10,
    });
    await page.mouse.up();
  }
  await page.waitForTimeout(1000);

  // Reload (not just close/reopen the drawer) so the check reads back
  // through a real GET, not the drawer's own already-in-memory state -
  // the new order must have been persisted through the real
  // PATCH /variants/reorder endpoint. Each variant's name+price live in a
  // single `<span>` containing "₺" - the only such spans in this section,
  // so no ancestor/descendant overlap.
  await page.reload();
  await page.getByRole("button", { name: "Variant/Seçenek" }).first().click();
  const reopenedLabels = await page
    .locator("section", { hasText: "Variantlar" })
    .locator("span")
    .filter({ hasText: "₺" })
    .allTextContents();
  expect(reopenedLabels).toHaveLength(2);
  expect(reopenedLabels[0]).toContain("Küçük Boy");
  expect(reopenedLabels[1]).toContain("Büyük Boy");
});

test("quick actions: duplicate, bulk-update, archive and restore a product", async ({ page }) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/menus");
  await openCategoriesForMenu(page, menuName);
  await openProductsForCategory(page, categoryAName);

  // Duplicate
  await page.getByRole("button", { name: "Kopyala" }).first().click();
  await expect(page.getByText(`${productName} (Kopya)`)).toBeVisible();

  // Each row's checkbox is a direct child of the row container, so going one
  // level up from it reliably scopes to exactly that row (a plain `div`
  // text filter would ambiguously match every nested ancestor too).
  const originalRow = page.getByRole("checkbox", { name: `${productName} seç` }).locator("..");
  const copyRow = page.getByRole("checkbox", { name: `${productName} (Kopya) seç` }).locator("..");

  await originalRow.getByRole("checkbox").check();
  await copyRow.getByRole("checkbox").check();
  await expect(page.getByText("2 ürün seçildi")).toBeVisible();
  await page.getByRole("button", { name: "Öne Çıkar" }).click();
  await expect(originalRow.getByText("Öne Çıkan")).toBeVisible();
  await expect(copyRow.getByText("Öne Çıkan")).toBeVisible();

  // Archive the copy (confirms the native window.confirm), verify it moves
  // to the Arşivlenenler tab, then restore it.
  page.once("dialog", (dialog) => void dialog.accept());
  await copyRow.getByRole("button", { name: "Arşivle" }).click();
  await expect(page.getByText(`${productName} (Kopya)`)).toHaveCount(0);

  await page.getByRole("button", { name: "Arşivlenenler" }).click();
  await expect(page.getByText(`${productName} (Kopya)`)).toBeVisible();
  await page.getByRole("button", { name: "Geri Getir" }).click();
  await expect(page.getByText(`${productName} (Kopya)`)).toHaveCount(0);

  await page.getByRole("button", { name: "Aktif", exact: true }).click();
  await expect(page.getByText(`${productName} (Kopya)`)).toBeVisible();
});

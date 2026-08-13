import path from "node:path";

import { expect, test } from "@playwright/test";

import { loginAsTenantOwner } from "./helpers/login";

const FIXTURE_IMAGE = path.join(__dirname, "fixtures", "test-image.png");

test.afterEach(async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- the generated Prisma client is CJS and isn't a workspace dependency of `tests/`
  const { PrismaClient } = require("../../packages/database/generated/client");
  const prisma = new PrismaClient();
  await prisma.media.deleteMany({ where: { originalFilename: "test-image.png" } });
  await prisma.$disconnect();
});

test("uploading an image adds it to the media library and renders its thumbnail", async ({ page }) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/media");

  await page.locator('input[type="file"]').setInputFiles(FIXTURE_IMAGE);

  await expect(page.getByText("Yüklendi", { exact: true })).toBeVisible();
  await expect(page.locator("img[alt='test-image.png']")).toBeVisible();
});

test("deleting a media item removes it from the library", async ({ page }) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/media");

  await page.locator('input[type="file"]').setInputFiles(FIXTURE_IMAGE);
  await expect(page.locator("img[alt='test-image.png']")).toBeVisible();

  page.on("dialog", (dialog) => dialog.accept());
  // Scoped to this specific upload's own card (img's direct parent, per
  // MediaLibrary.tsx's markup), not `.first()` - the shared tenant's media
  // library can hold other items left over from other specs/runs, and
  // `.first()` would delete whichever of those happens to sort first
  // instead of the item this test just uploaded.
  const card = page.locator("img[alt='test-image.png']").locator("..");
  await card.getByRole("button", { name: "Sil" }).click();

  await expect(page.locator("img[alt='test-image.png']")).toHaveCount(0);
});

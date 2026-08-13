import { expect, test } from "@playwright/test";

import { loginAsTenantOwner } from "./helpers/login";

// Exercises the real Business Profile page against the real API and
// database - form fill, save, and persistence across a reload.
test.afterEach(async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- the generated Prisma client is CJS and isn't a workspace dependency of `tests/`
  const { PrismaClient } = require("../../packages/database/generated/client");
  const prisma = new PrismaClient();
  await prisma.tenant.updateMany({ where: { slug: "sahil-cafe" }, data: { about: null, phone: null } });
  await prisma.$disconnect();
});

test("filling in and saving the business profile persists after a reload", async ({ page }) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/profile");

  const about = `Playwright test description ${Date.now()}`;
  await page.getByLabel("Hakkında").fill(about);
  await page.getByRole("button", { name: "Kaydet" }).click();

  // .first() - the toast's own aria-live announcer region duplicates the
  // visible title text for screen readers, which otherwise makes this an
  // ambiguous (strict-mode) match.
  await expect(page.getByText("Kaydedildi").first()).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Hakkında")).toHaveValue(about);
});

test("business profile page shows logo/cover upload dropzones", async ({ page }) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/profile");

  await expect(page.getByText("Logo yükle")).toBeVisible();
  await expect(page.getByText("Kapak görseli yükle")).toBeVisible();
});

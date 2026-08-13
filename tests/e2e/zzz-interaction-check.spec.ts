import { expect, test } from "@playwright/test";

test("real click-to-feedback timing on storefront category tab and login button", async ({ page }) => {
  await page.goto("/sahil-cafe/menu");
  await page.waitForLoadState("networkidle");

  const tabs = page.getByRole("button").filter({ hasText: /.+/ }).first();
  const t0 = Date.now();
  await tabs.click();
  await page.waitForTimeout(50);
  console.log("category tab click->settle approx:", Date.now() - t0, "ms");

  await page.goto("/login");
  const emailInput = page.getByLabel("E-posta");
  await emailInput.fill("mert.kaya@sahil-cafe.dev");
  await page.getByLabel("Şifre", { exact: true }).fill("Passw0rd!23");
  const button = page.getByRole("button", { name: "Giriş Yap" });

  const t1 = Date.now();
  await button.click();
  await page.waitForURL(/\/business$/, { timeout: 5000 });
  console.log("login click->redirect:", Date.now() - t1, "ms");
});

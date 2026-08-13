import { expect, test } from "@playwright/test";

import { ensureDevAdminExists } from "./helpers/dev-admin";

// Real login with the fixed development SUPER_ADMIN account (see HOTFIX
// "Otomatik Development Super Admin") against the real API/database, proving
// the DEV_ADMIN_* credentials actually work end to end and land on /admin.
test("logging in with the fixed dev admin account redirects to /admin", async ({ page }) => {
  const { email, password } = await ensureDevAdminExists();

  await page.goto("/login");
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Giriş Yap" }).click();

  await expect(page).toHaveURL(/\/admin$/);
});

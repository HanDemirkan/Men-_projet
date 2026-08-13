import type { Page } from "@playwright/test";

import { ensureDevAdminExists } from "./dev-admin";

// Real login against the real API and Sprint 2 seed users - shared by every
// spec that needs an authenticated session before reaching a business panel
// page.
export async function loginAsTenantOwner(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill("mert.kaya@sahil-cafe.dev");
  await page.getByLabel("Şifre", { exact: true }).fill("Passw0rd!23");
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await page.waitForURL(/\/business$/);
}

// Sprint 5: the same demo tenant's BRANCH_MANAGER (Zeynep Demir), pinned to
// the single seeded branch - shared by business-panel specs that need to
// prove BRANCH_MANAGER-scoped behavior in a real browser.
export async function loginAsBranchManager(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill("zeynep.demir@sahil-cafe.dev");
  await page.getByLabel("Şifre", { exact: true }).fill("Passw0rd!23");
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await page.waitForURL(/\/business$/);
}

// Sprint 4: real login as the fixed dev SUPER_ADMIN account (seeded directly
// via ensureDevAdminExists() since NODE_ENV=test skips the automatic dev
// bootstrap - see that helper's own comment) - shared by every admin-area spec.
export async function loginAsSuperAdmin(page: Page): Promise<void> {
  const { email, password } = await ensureDevAdminExists();

  await page.goto("/login");
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await page.waitForURL(/\/admin$/);
}

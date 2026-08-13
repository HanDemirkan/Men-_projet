import { expect, test } from "@playwright/test";

// Exercises the real login flow in a real browser against the real API and
// database (the Sprint 2 seed users) - cookies, redirects, and guards are
// never mocked here.
test("logging in with the wrong password shows an error and stays on /login", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("E-posta").fill("mert.kaya@sahil-cafe.dev");
  await page.getByLabel("Şifre", { exact: true }).fill("WrongPassword123!");
  await page.getByRole("button", { name: "Giriş Yap" }).click();

  await expect(page.getByText("E-posta veya şifre hatalı.", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("logging in with real seeded credentials redirects to the role's panel", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("E-posta").fill("mert.kaya@sahil-cafe.dev");
  await page.getByLabel("Şifre", { exact: true }).fill("Passw0rd!23");
  await page.getByRole("button", { name: "Giriş Yap" }).click();

  await expect(page).toHaveURL(/\/business$/);
  // Scoped to the header's user menu, not a bare text match - the business
  // dashboard's real "Son Aktiviteler" audit table (Sprint 5) can also
  // render the actor's name, which would make an unscoped match ambiguous.
  await expect(page.getByRole("button", { name: "MK Mert Kaya" })).toBeVisible();
});

test("repeated failed login attempts show a single toast, not stacked duplicates", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill("mert.kaya@sahil-cafe.dev");
  await page.getByLabel("Şifre", { exact: true }).fill("WrongPassword123!");

  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page.getByText("Giriş başarısız", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page.getByText("E-posta veya şifre hatalı.", { exact: true })).toBeVisible();

  // The fix gives every auth-error toast the same stable id so a repeat
  // failure updates it in place - asserting exactly one confirms it never
  // stacks a second, duplicate toast. Exact match excludes Radix's own
  // aria-live announcer span, which duplicates the toast text for
  // screen readers and would otherwise make this assertion ambiguous.
  await expect(page.getByText("Giriş başarısız", { exact: true })).toHaveCount(1);
});

test("visiting a protected panel without a session redirects to /login", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/business");

  await expect(page).toHaveURL(/\/login$/);
});

test("logging out clears the session and returns to /login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill("mert.kaya@sahil-cafe.dev");
  await page.getByLabel("Şifre", { exact: true }).fill("Passw0rd!23");
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page).toHaveURL(/\/business$/);

  await page.getByRole("button", { name: "Mert Kaya" }).click();
  await page.getByText("Çıkış Yap").click();

  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/business");
  await expect(page).toHaveURL(/\/login$/);
});

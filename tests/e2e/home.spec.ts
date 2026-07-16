import { expect, test } from "@playwright/test";

test("home page loads and shows the hero headline", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "QR Menüden Fazlası" })).toBeVisible();
});

test("home page nav links to login and the features section", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Özellikler" }),
  ).toBeVisible();
  await expect(
    page.locator("header").getByRole("link", { name: "Giriş Yap" }).first(),
  ).toBeVisible();
});

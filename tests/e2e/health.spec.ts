import { expect, test } from "@playwright/test";

test("health page loads and shows the health panel heading", async ({ page }) => {
  await page.goto("/health");

  await expect(page.getByRole("heading", { name: "Sistem Durumu" })).toBeVisible();
});

test("health page shows service status information", async ({ page }) => {
  await page.goto("/health");

  await expect(page.getByText("API", { exact: true })).toBeVisible();
  await expect(page.getByText("PostgreSQL", { exact: true })).toBeVisible();
  await expect(page.getByText("Redis", { exact: true })).toBeVisible();
});

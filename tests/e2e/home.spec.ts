import { expect, test } from "@playwright/test";

test("home page loads and shows the project name", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "QR Platform" })).toBeVisible();
  await expect(page.getByText("Web uygulaması çalışıyor.")).toBeVisible();
});

test("home page shows health information for API, PostgreSQL and Redis", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("PostgreSQL")).toBeVisible();
  await expect(page.getByText("Redis")).toBeVisible();
});

import { expect, test } from "@playwright/test";

import { loginAsTenantOwner } from "./helpers/login";

// QR permanence (Sprint 7 addendum): a printed QR code only ever encodes
// `/{tenantSlug}` and is never reprinted, so renaming a tenant's slug must
// not break scans of the already-printed code - the old slug has to
// 308-redirect to whatever the current one is. Exercises the real Business
// Profile slug field + the real public middleware's alias fallback, not a
// mocked redirect table.
const runId = Date.now();
const originalSlug = "sahil-cafe";
const renamedSlug = `sahil-cafe-renamed-${runId}`;

test.afterEach(async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- the generated Prisma client is CJS and isn't a workspace dependency of `tests/`
  const { PrismaClient } = require("../../packages/database/generated/client");
  const prisma = new PrismaClient();
  // Always restore the shared fixture tenant's slug, even if an assertion
  // above failed mid-test - every other spec file assumes "sahil-cafe" works.
  await prisma.tenant.updateMany({ where: { slug: renamedSlug }, data: { slug: originalSlug } });
  await prisma.tenantSlugAlias.deleteMany({ where: { oldSlug: { in: [originalSlug, renamedSlug] } } });
  await prisma.$disconnect();
});

test("renaming the storefront slug leaves the old QR URL 308-redirecting to the new one", async ({
  page,
  browser,
}) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/profile");

  // Wait for the async profile GET to populate the form before editing it -
  // filling too early races the fetch's later `reset()` call and corrupts
  // the field (observed once as a literal string concatenation of both
  // values).
  await expect(page.getByLabel("Slug")).toHaveValue(originalSlug);
  await page.getByLabel("Slug").fill(renamedSlug);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kaydedildi").first()).toBeVisible();

  // Anonymous browser context - simulates a customer scanning the
  // already-printed code, which still points at the pre-rename slug.
  const context = await browser.newContext();
  const anonPage = await context.newPage();

  const response = await anonPage.goto(`/${originalSlug}?src=qr`);

  // The final rendered page is the live storefront at the NEW slug, and the
  // browser's address bar reflects it - not a silently-served alias page.
  expect(anonPage.url()).toContain(`/${renamedSlug}`);
  expect(anonPage.url()).toContain("src=qr");
  await expect(anonPage.getByRole("heading", { name: "Sahil Cafe" })).toBeVisible();

  // The actual first hop in the chain was a real 308, not a client-side
  // redirect that happens to land on the right content.
  const initialRequest = response?.request().redirectedFrom();
  const initialResponse = await initialRequest?.response();
  expect(initialResponse?.status()).toBe(308);

  await context.close();

  // The freshly-claimed slug also works directly, unaffected by the alias.
  const directContext = await browser.newContext();
  const directPage = await directContext.newPage();
  await directPage.goto(`/${renamedSlug}`);
  await expect(directPage.getByRole("heading", { name: "Sahil Cafe" })).toBeVisible();
  await directContext.close();
});

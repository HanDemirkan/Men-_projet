import { expect, test } from "@playwright/test";
import { playAudit } from "playwright-lighthouse";

// Real Lighthouse audit (spec §11/§12) against a real production build
// (`next build` + `next start`, not the dev server - see
// docs/decisions/0009-storefront-theme-and-publishing.md for why dev-mode
// numbers wouldn't be representative) of the actual public storefront page.
// No `thresholds` are passed - this deliberately never fails the test on a
// low score; the real numeric scores are printed and belong in the
// delivery report exactly as measured, "90+" claimed only if actually hit.
test("public storefront home page - real Lighthouse audit", async ({ page }) => {
  await page.goto("/sahil-cafe");

  const result = await playAudit({
    page,
    port: 9222,
    // Thresholds set to 0 (never fails the test on score) - passing this
    // object is also how playwright-lighthouse restricts Lighthouse's
    // `onlyCategories` to just these four. Without it, playwright-lighthouse
    // 4.x's default category list still includes "pwa", which Lighthouse
    // 13.x removed support for, and the audit errors out entirely.
    thresholds: { performance: 0, accessibility: 0, "best-practices": 0, seo: 0 },
    reports: {
      formats: { html: true, json: true },
      directory: "./lighthouse-report",
      name: "storefront-sahil-cafe",
    },
  });

  const categories = result.lhr.categories;
  const scores = {
    performance: Math.round((categories["performance"]?.score ?? 0) * 100),
    accessibility: Math.round((categories["accessibility"]?.score ?? 0) * 100),
    "best-practices": Math.round((categories["best-practices"]?.score ?? 0) * 100),
    seo: Math.round((categories["seo"]?.score ?? 0) * 100),
  };

  // eslint-disable-next-line no-console -- this is the delivery report's source of truth for the real measured scores
  console.log("LIGHTHOUSE_SCORES", JSON.stringify(scores));

  // Sanity only - proves a real audit actually ran and produced real
  // category scores, not that any particular threshold was met.
  expect(categories["performance"]).toBeDefined();
  expect(categories["accessibility"]).toBeDefined();
});

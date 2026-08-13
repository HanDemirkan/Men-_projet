import { expect, test } from "@playwright/test";
import { playAudit } from "playwright-lighthouse";

// Sprint 8 §1: real, measured "before" numbers for all 8 pages the spec
// names, against a real production build (`next build` + `next start`) -
// see storefront.spec.ts's own comment for why dev mode is never used here.
// No `thresholds` - never fails on score, the numbers are reported as-is.
const THRESHOLDS = { performance: 0, accessibility: 0, "best-practices": 0, seo: 0 };

async function audit(page: import("@playwright/test").Page, name: string) {
  const result = await playAudit({
    page,
    port: 9222,
    thresholds: THRESHOLDS,
    // Lighthouse's navigation-mode audit clears cookies/storage by default
    // before its own internal reload (to guarantee a "first visit" trace) -
    // for an authenticated page that silently wipes the session, bounces the
    // reload to /login, and reports THAT page's content as the audited
    // page's own LCP element. Confirmed via lcp-breakdown-insight showing
    // the login page's subtitle as admin-dashboard's "LCP element" even
    // though `page.url()` was genuinely /admin right before this call.
    opts: { disableStorageReset: true },
    reports: { formats: { html: true, json: true }, directory: "./lighthouse-report", name },
  });
  const categories = result.lhr.categories;
  const scores = {
    performance: Math.round((categories["performance"]?.score ?? 0) * 100),
    accessibility: Math.round((categories["accessibility"]?.score ?? 0) * 100),
    "best-practices": Math.round((categories["best-practices"]?.score ?? 0) * 100),
    seo: Math.round((categories["seo"]?.score ?? 0) * 100),
  };
  const fcp = result.lhr.audits["first-contentful-paint"]?.numericValue;
  const lcp = result.lhr.audits["largest-contentful-paint"]?.numericValue;
  const tbt = result.lhr.audits["total-blocking-time"]?.numericValue;
  const cls = result.lhr.audits["cumulative-layout-shift"]?.numericValue;
  const tti = result.lhr.audits["interactive"]?.numericValue;
  // eslint-disable-next-line no-console -- source of truth for the delivery report
  console.log(
    `LIGHTHOUSE[${name}]`,
    JSON.stringify({ ...scores, fcp_ms: fcp, lcp_ms: lcp, tbt_ms: tbt, cls, tti_ms: tti }),
  );
  expect(categories["performance"]).toBeDefined();
}

async function login(page: import("@playwright/test").Page, email: string, password: string, redirectPattern: RegExp) {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await page.waitForURL(redirectPattern);
}

test("landing page", async ({ page }) => {
  await page.goto("/");
  await audit(page, "landing");
});

test("login page", async ({ page }) => {
  await page.goto("/login");
  await audit(page, "login");
});

test("admin dashboard", async ({ page }) => {
  await login(page, "elif.aydin@qrplatform.dev", "Passw0rd!23", /\/admin$/);
  // A fresh full navigation (not the tail of the post-login client-side
  // redirect) - matches every other authenticated test below, and is what
  // Lighthouse's navigation-mode audit is actually meant to measure: a real
  // cold visit to this URL, not a mid-flight SPA transition's trace.
  await page.goto("/admin");
  await audit(page, "admin-dashboard");
});

test("business dashboard", async ({ page }) => {
  await login(page, "mert.kaya@sahil-cafe.dev", "Passw0rd!23", /\/business$/);
  await page.goto("/business");
  await audit(page, "business-dashboard");
});

test("business menus", async ({ page }) => {
  await login(page, "mert.kaya@sahil-cafe.dev", "Passw0rd!23", /\/business$/);
  await page.goto("/business/menus");
  await audit(page, "business-menus");
});

test("business products", async ({ page }) => {
  await login(page, "mert.kaya@sahil-cafe.dev", "Passw0rd!23", /\/business$/);
  await page.goto("/business/products");
  await audit(page, "business-products");
});

test("QR builder", async ({ page }) => {
  await login(page, "mert.kaya@sahil-cafe.dev", "Passw0rd!23", /\/business$/);
  await page.goto("/business/storefront");
  await audit(page, "qr-builder");
});

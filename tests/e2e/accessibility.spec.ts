import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { loginAsSuperAdmin, loginAsTenantOwner } from "./helpers/login";

// Sprint 6, Section 14: real automated accessibility audits (axe-core) on
// the highest-traffic screens in each area of the product - not a claim
// that everything is checked, but real, repeatable coverage of a
// representative page per area. `wcag2a`/`wcag2aa` matches the sprint's
// "kontrast, aria-label, form label, landmark" requirements; axe catches
// these plus much more (missing alt text, invalid ARIA, etc.) than any
// hand-written check would.
//
// reducedMotion is emulated before every navigation, but that alone isn't
// enough: Framer Motion's `reducedMotion="user"` (see AppProviders) is only
// evaluated once React hydrates client-side, so there's an unavoidable
// window right after navigation where the SSR'd, still-hydrating page sits
// at its `initial` (partially transparent) PageTransition state regardless
// of the emulated media query. Sampling axe's color-contrast check during
// that window caught transient frames as "real" failures (e.g. near-white
// text on white) that were never the page's actual resting state. Waiting
// for the PageTransition wrapper (see PageTransition.tsx) to reach its
// settled opacity - a real, auto-retrying condition, not a fixed sleep -
// removes the race regardless of CPU load.
// Not every route wraps its content in PageTransition (the public landing
// page's layout doesn't - see (public)/page.tsx) - the landing page's own
// HeroSection has its own independent motion.div (data-testid="hero-content")
// that races the same way under load, confirmed by a full-suite run flagging
// its exact resting color blended at ~58% opacity as a false-positive
// contrast failure. Waiting on whichever settle marker is actually present
// covers both cases without hanging on one that never appears.
async function waitForSettled(page: import("@playwright/test").Page) {
  for (const testId of ["page-transition", "hero-content"]) {
    const wrapper = page.getByTestId(testId);
    if ((await wrapper.count()) > 0) {
      await expect(wrapper).toHaveCSS("opacity", "1");
    }
  }
}

async function gotoAndAudit(page: import("@playwright/test").Page, url: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  await waitForSettled(page);
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
}

test.describe("accessibility (axe)", () => {
  test("landing page has no serious/critical violations", async ({ page }) => {
    const results = await gotoAndAudit(page, "/");
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("login page has no serious/critical violations", async ({ page }) => {
    const results = await gotoAndAudit(page, "/login");
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("admin dashboard has no serious/critical violations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await loginAsSuperAdmin(page);
    await waitForSettled(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("business dashboard has no serious/critical violations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await loginAsTenantOwner(page);
    await waitForSettled(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("public storefront home page has no serious/critical violations", async ({ page }) => {
    const results = await gotoAndAudit(page, "/sahil-cafe");
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});

test.describe("keyboard navigation", () => {
  test("landing page has a working skip-to-content link as the first focusable element", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "İçeriğe geç" });
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");
    const main = page.locator("#main-content");
    await expect(main).toBeFocused();
  });

  test("the whole login form is reachable and submittable using only the keyboard", async ({ page }) => {
    await page.goto("/login");

    // Focus the email field directly (simulates "the user tabbed their way
    // here"), then use real Tab presses for the rest of the form - proving
    // the actual tab order reaches password then submit, not just that each
    // field is individually focusable. One extra Tab hop through "Şifremi
    // Unuttum" is expected: it sits between the two fields in DOM order.
    // .fill() (not keyboard.type()) - the field is dev-mode prefilled with
    // the dev admin's own email, and .type() appends rather than replacing
    // it, silently producing an invalid concatenated address.
    await page.getByLabel("E-posta").fill("mert.kaya@sahil-cafe.dev");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Şifremi Unuttum" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Şifre", { exact: true })).toBeFocused();
    // Also dev-mode prefilled - same reasoning as the email field above.
    await page.getByLabel("Şifre", { exact: true }).fill("Passw0rd!23");

    // One more hop to "Beni hatırla", then submit - reaching it and
    // activating it via the keyboard, not a raw Enter-in-a-text-field
    // shortcut, is the more literal proof of "keyboard operable".
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Beni hatırla")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Giriş Yap" })).toBeFocused();
    await page.keyboard.press("Enter");

    await page.waitForURL(/\/business$/);
  });
});

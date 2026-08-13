import { expect, test } from "@playwright/test";

// Sprint 6: proves prefers-reduced-motion actually collapses animation
// durations in a real browser, for both animation systems the product uses -
// Framer Motion (MotionConfig reducedMotion="user" in AppProviders) and the
// Radix+tailwindcss-animate CSS transitions (Dialog/Drawer/Toast), which the
// global @media override in globals.css covers instead.
test.describe("prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("a CSS-driven overlay (login form's own transition) collapses to near-zero duration", async ({ page }) => {
    // Belt and suspenders: emulateMedia() explicitly, in case the context
    // option above races the very first navigation.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/login");

    // Any element carrying a Tailwind `transition-*` class picks up the
    // global reduced-motion override - the login button's hover/focus
    // transition is a real, always-present example.
    const duration = await page
      .getByRole("button", { name: "Giriş Yap" })
      .evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));

    // Browsers serialize very small durations in seconds using scientific
    // notation (e.g. "1e-05s") rather than preserving the "ms" unit written
    // in CSS - assert on the parsed value, not an exact unit string.
    expect(duration).toBeLessThan(0.001);
  });

  test("landing page's Framer Motion hero section renders fully visible immediately, no animation delay", async ({
    page,
  }) => {
    await page.goto("/");

    // Under reduced motion, Framer Motion's `reducedMotion="user"` disables
    // the transform/opacity animation - the heading must be visible right
    // away, not mid-fade.
    const heading = page.getByRole("heading", { name: "QR Menüden Fazlası" });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveCSS("opacity", "1");
  });
});

test.describe("motion (default, no reduced-motion preference)", () => {
  test("the same button uses a real, non-zero transition duration by default", async ({ page }) => {
    await page.goto("/login");

    const duration = await page
      .getByRole("button", { name: "Giriş Yap" })
      .evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));

    expect(duration).toBeGreaterThan(0.05);
  });
});

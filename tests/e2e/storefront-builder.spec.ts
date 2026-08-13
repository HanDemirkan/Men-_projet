import { expect, test } from "@playwright/test";

import { loginAsTenantOwner } from "./helpers/login";

const tenantSlug = "sahil-cafe";

// Playwright's `.fill()` on a native `type="color"` input proved unreliable
// against this React controlled input: React tracks the DOM value via its
// own internal setter and only fires onChange when the value is written
// through that setter with a real "input" event dispatched afterward -
// `.fill()` sometimes resolves without triggering it, silently leaving the
// color (and therefore the whole test) unchanged. Writing through the
// native HTMLInputElement setter and dispatching the events by hand is the
// standard, reliable pattern for this class of React input.
async function setColorInput(page: import("@playwright/test").Page, selector: string, value: string): Promise<void> {
  const input = page.locator(selector);
  await input.evaluate((el: HTMLInputElement, v: string) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    setter?.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await expect(input).toHaveValue(value);
}

// Sprint 7's builder is a real 7-step stepper (Şablon/Marka/Renk-Yazı/
// Bölümler/Menü Görünümü/Önizle/Yayınla) - advances only via "İleri", one
// step at a time, matching how a real user would move through it.
async function advanceSteps(page: import("@playwright/test").Page, count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await page.getByRole("button", { name: "İleri" }).click();
  }
}

// Restores the tenant's storefront config to a known-clean (unset) state so
// this spec doesn't leak theme changes into other specs/runs. Sprint 7
// moved this off Tenant into its own table (see TenantStorefrontConfig).
test.afterEach(async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- the generated Prisma client is CJS and isn't a workspace dependency of `tests/`
  const { PrismaClient } = require("../../packages/database/generated/client");
  const prisma = new PrismaClient();
  await prisma.tenantStorefrontConfig.deleteMany({ where: { tenant: { slug: tenantSlug } } });
  await prisma.storefrontConfigRevision.deleteMany({ where: { tenant: { slug: tenantSlug } } });
  await prisma.$disconnect();
});

test("changing a theme color updates the live preview instantly, without saving", async ({ page }) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/storefront");

  const preview = page.getByTestId("storefront-preview");
  const before = await preview.getAttribute("style");

  // Step 1 (Şablon) -> step 2 (Marka) -> step 3 (Renk ve Yazı).
  await advanceSteps(page, 2);
  await setColorInput(page, "#sf-primary-color", "#00ff00");
  // No "Kaydet" click yet - this must be pure client-state.
  const after = await preview.getAttribute("style");

  expect(after).toContain("#00ff00");
  expect(after).not.toBe(before);
});

test("selecting a ready-made template instantly restyles the preview", async ({ page }) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/storefront");

  await page.getByRole("button", { name: /Premium Restaurant/ }).click();
  const preview = page.getByTestId("storefront-preview");
  // Premium Restaurant's own palette (Deep Navy) - its distinctive primary
  // color is enough to prove the whole template (not just one color)
  // actually applied.
  await expect(preview).toHaveAttribute("style", /#1B2A4A/);
});

test("draft/publish: Kaydet persists the draft but the public storefront stays unchanged until Yayınla", async ({
  page,
  browser,
}) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/storefront");

  await advanceSteps(page, 2);
  await setColorInput(page, "#sf-primary-color", "#123456");

  // The status bar (Kaydet/Yayınla/Yayını Geri Al) stays visible regardless
  // of which step is active - it's a persistent top bar, not step content.
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kaydedildi", { exact: true })).toBeVisible();
  await expect(page.getByText("Yayınlanmamış değişiklikler var")).toBeVisible();

  // Public storefront (fresh, cookie-less context) must still show the old color.
  const publicContext = await browser.newContext();
  const before = await (
    await publicContext.request.get(`http://localhost:4000/api/v1/storefront/${tenantSlug}`)
  ).json();
  expect(before.data.storefrontConfig.theme.primaryColor).not.toBe("#123456");

  await page.getByRole("button", { name: "Yayınla", exact: true }).click();
  await expect(page.getByText("Yayınlandı", { exact: true })).toBeVisible();
  await expect(page.getByText("Yayında", { exact: true })).toBeVisible();

  const after = await (
    await publicContext.request.get(`http://localhost:4000/api/v1/storefront/${tenantSlug}`)
  ).json();
  expect(after.data.storefrontConfig.theme.primaryColor).toBe("#123456");

  await publicContext.close();
});

test("Yayını Geri Al reverts to the previous publish", async ({ page, browser }) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/storefront");

  // First publish: default theme.
  await page.getByRole("button", { name: "Yayınla", exact: true }).click();
  await expect(page.getByText("Yayınlandı", { exact: true })).toBeVisible();
  // Toasts auto-dismiss after a few seconds - wait it out before the second
  // publish, or its own "Yayınlandı" toast collides with this stale one.
  await expect(page.getByText("Yayınlandı", { exact: true })).toBeHidden();

  // Second publish: a real, different color.
  await advanceSteps(page, 2);
  await setColorInput(page, "#sf-primary-color", "#abcdef");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kaydedildi", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Yayınla", exact: true }).click();
  await expect(page.getByText("Yayınlandı", { exact: true })).toBeVisible();

  const publicContext = await browser.newContext();
  const afterSecondPublish = await (
    await publicContext.request.get(`http://localhost:4000/api/v1/storefront/${tenantSlug}`)
  ).json();
  expect(afterSecondPublish.data.storefrontConfig.theme.primaryColor).toBe("#abcdef");

  await page.getByRole("button", { name: "Yayını Geri Al" }).click();
  await expect(page.getByText("Geri alındı", { exact: true })).toBeVisible();

  const afterRevert = await (
    await publicContext.request.get(`http://localhost:4000/api/v1/storefront/${tenantSlug}`)
  ).json();
  expect(afterRevert.data.storefrontConfig.theme.primaryColor).not.toBe("#abcdef");

  await publicContext.close();
});

test("downloads a real PNG QR code from the Yayınla step", async ({ page }) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/storefront");

  // Step 7 (Yayınla) also hosts QR/SEO settings - not its own top-level tab
  // anymore (spec §3's 7-step list doesn't have a separate QR step).
  await advanceSteps(page, 6);
  const preview = page.getByAltText("QR kod önizlemesi");
  await expect(preview).toBeVisible();
  // `toBeVisible` alone doesn't prove the <img> actually loaded - a broken
  // cross-origin image is still a "visible" DOM element. This caught a real
  // bug: the endpoint was missing the Cross-Origin-Resource-Policy override
  // Media's streaming routes already have, so the browser silently blocked
  // the image load even though the request itself succeeded.
  await expect.poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "PNG İndir" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("qr-code.png");
});

test("contrast guard: an unreadable text/background combination blocks Kaydet", async ({ page }) => {
  await loginAsTenantOwner(page);
  await page.goto("/business/storefront");

  await advanceSteps(page, 2);
  // Near-white text on the (white-ish) default background - fails WCAG AA.
  await setColorInput(page, "#sf-text", "#f5f5f5");

  await expect(page.getByText(/kaydedilemez/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Kaydet" })).toBeDisabled();
});

test("mobile: Ayarlar / Önizle / Yayınla tabs all render without errors", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAsTenantOwner(page);
  await page.goto("/business/storefront");

  await expect(page.getByRole("tab", { name: "Ayarlar" })).toBeVisible();

  await page.getByRole("tab", { name: "Önizle" }).click();
  await expect(page.getByRole("button", { name: "Mobil" })).toBeVisible();

  await page.getByRole("tab", { name: "Yayınla" }).click();
  await expect(page.getByAltText("QR kod önizlemesi")).toBeVisible();
});

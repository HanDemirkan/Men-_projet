
import type { StorefrontTypographyPairing } from "@qr-platform/shared";
import { TYPOGRAPHY_PAIRINGS } from "@qr-platform/shared";
import {
  DM_Sans,
  Inter,
  Merriweather,
  Montserrat,
  Open_Sans,
  Playfair_Display,
  Poppins,
  Source_Sans_3,
} from "next/font/google";

// next/font/google loaders must be static top-level calls - a tenant's
// chosen pairing is only known at render time, so every font used by any
// of the 6 pairings is loaded once here (self-hosted by Next, no runtime
// network request) and exposed as a CSS variable; theme-to-css.ts then
// picks which two variables (heading/body) apply for a given tenant.
const inter = Inter({ subsets: ["latin"], variable: "--sf-font-inter", display: "swap" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--sf-font-playfair", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--sf-font-poppins", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--sf-font-dmsans", display: "swap" });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"], variable: "--sf-font-merriweather", display: "swap" });
const sourceSans3 = Source_Sans_3({ subsets: ["latin"], variable: "--sf-font-sourcesans", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--sf-font-montserrat", display: "swap" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--sf-font-opensans", display: "swap" });

export const STOREFRONT_FONT_VARIABLES = [
  inter.variable,
  playfairDisplay.variable,
  poppins.variable,
  dmSans.variable,
  merriweather.variable,
  sourceSans3.variable,
  montserrat.variable,
  openSans.variable,
].join(" ");

const FONT_FAMILY_TO_CSS_VAR: Record<string, string> = {
  Inter: "var(--sf-font-inter)",
  "Playfair Display": "var(--sf-font-playfair)",
  Poppins: "var(--sf-font-poppins)",
  "DM Sans": "var(--sf-font-dmsans)",
  Merriweather: "var(--sf-font-merriweather)",
  "Source Sans 3": "var(--sf-font-sourcesans)",
  Montserrat: "var(--sf-font-montserrat)",
  "Open Sans": "var(--sf-font-opensans)",
};

export function resolveTypographyCssVars(pairing: StorefrontTypographyPairing): {
  headingFontVar: string;
  bodyFontVar: string;
} {
  const def = TYPOGRAPHY_PAIRINGS[pairing];
  return {
    headingFontVar: FONT_FAMILY_TO_CSS_VAR[def.headingFont] ?? "var(--sf-font-inter)",
    bodyFontVar: FONT_FAMILY_TO_CSS_VAR[def.bodyFont] ?? "var(--sf-font-inter)",
  };
}

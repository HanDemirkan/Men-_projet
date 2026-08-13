import type { FooterStyle } from "@qr-platform/shared";
import dynamic from "next/dynamic";

import type { StorefrontFooterProps } from "./types";

import type { StorefrontComponentPlugin } from "@/features/storefront/registry/plugin-types";

export type { StorefrontFooterProps } from "./types";

// See hero/index.ts's comment - `next/dynamic` per entry, not a static
// import, so a page only bundles the one footer style it actually uses.
export const FOOTER_REGISTRY: Record<FooterStyle, StorefrontComponentPlugin<StorefrontFooterProps>> = {
  minimal: {
    code: "minimal",
    label: "Minimal",
    version: 1,
    capabilities: ["footerText"],
    Component: dynamic(() => import("./MinimalFooter").then((m) => m.MinimalFooter)),
  },
  detailed: {
    code: "detailed",
    label: "Detaylı",
    version: 1,
    capabilities: ["footerText", "copyright"],
    Component: dynamic(() => import("./DetailedFooter").then((m) => m.DetailedFooter)),
  },
  "social-band": {
    code: "social-band",
    label: "Sosyal Medya Şeridi",
    version: 1,
    capabilities: ["footerText", "copyright", "social"],
    Component: dynamic(() => import("./SocialBandFooter").then((m) => m.SocialBandFooter)),
  },
};

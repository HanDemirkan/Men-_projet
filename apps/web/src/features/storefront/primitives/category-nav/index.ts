import type { CategoryNavStyle } from "@qr-platform/shared";
import dynamic from "next/dynamic";

import type { StorefrontCategoryNavProps } from "./types";

import type { StorefrontComponentPlugin } from "@/features/storefront/registry/plugin-types";

export type { CategoryNavItem, StorefrontCategoryNavProps } from "./types";

// See hero/index.ts's comment - `next/dynamic` per entry, not a static
// import, so a page only bundles the one nav style it actually uses.
export const CATEGORY_NAV_REGISTRY: Record<CategoryNavStyle, StorefrontComponentPlugin<StorefrontCategoryNavProps>> = {
  "sticky-tabs": {
    code: "sticky-tabs",
    label: "Yapışkan Sekmeler",
    version: 1,
    capabilities: ["sticky", "productCount"],
    Component: dynamic(() => import("./StickyTabsNav").then((m) => m.StickyTabsNav)),
  },
  "horizontal-pills": {
    code: "horizontal-pills",
    label: "Yatay Haplar",
    version: 1,
    capabilities: [],
    Component: dynamic(() => import("./HorizontalPillsNav").then((m) => m.HorizontalPillsNav)),
  },
  "vertical-list": {
    code: "vertical-list",
    label: "Dikey Liste",
    version: 1,
    capabilities: ["sidebar"],
    Component: dynamic(() => import("./VerticalListNav").then((m) => m.VerticalListNav)),
  },
  "image-cards": {
    code: "image-cards",
    label: "Görselli Kartlar",
    version: 1,
    capabilities: ["categoryImage"],
    Component: dynamic(() => import("./ImageCardsNav").then((m) => m.ImageCardsNav)),
  },
};

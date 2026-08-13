import type { ProductCardStyle } from "@qr-platform/shared";
import dynamic from "next/dynamic";

import type { StorefrontProductCardProps } from "./types";

import type { StorefrontComponentPlugin } from "@/features/storefront/registry/plugin-types";

export type { StorefrontProductCardProps } from "./types";
export { formatPrice, startingPrice } from "./types";

// See hero/index.ts's comment - `next/dynamic` per entry, not a static
// import, so a page only bundles the one card style it actually uses.
export const PRODUCT_CARD_REGISTRY: Record<ProductCardStyle, StorefrontComponentPlugin<StorefrontProductCardProps>> = {
  "horizontal-compact": {
    code: "horizontal-compact",
    label: "Yatay Kompakt",
    version: 1,
    capabilities: ["photo", "price", "prepTime"],
    Component: dynamic(() => import("./HorizontalCompactCard").then((m) => m.HorizontalCompactCard)),
  },
  "large-image": {
    code: "large-image",
    label: "Büyük Fotoğraf",
    version: 1,
    capabilities: ["photo", "price"],
    Component: dynamic(() => import("./LargeImageCard").then((m) => m.LargeImageCard)),
  },
  "minimal-text": {
    code: "minimal-text",
    label: "Sade Metin",
    version: 1,
    capabilities: ["price"],
    Component: dynamic(() => import("./MinimalTextCard").then((m) => m.MinimalTextCard)),
  },
  "grid-card": {
    code: "grid-card",
    label: "Izgara Kart",
    version: 1,
    capabilities: ["photo", "price", "grid"],
    Component: dynamic(() => import("./GridCard").then((m) => m.GridCard)),
  },
  "premium-editorial": {
    code: "premium-editorial",
    label: "Premium Sunum",
    version: 1,
    capabilities: ["photo", "price"],
    Component: dynamic(() => import("./PremiumEditorialCard").then((m) => m.PremiumEditorialCard)),
  },
};

// grid-card is the only style meant for a multi-column grid; every other
// style reads better as a single vertical stack.
export function productCardGridClassName(style: ProductCardStyle): string {
  return style === "grid-card" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2.5";
}

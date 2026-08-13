import type { StorefrontLayout, StorefrontTheme } from "@qr-platform/shared";

import type { Product } from "@/types/catalog";

export interface StorefrontProductCardProps {
  product: Product;
  theme: StorefrontTheme;
  layout: StorefrontLayout;
  href: string;
}

// Shared "no image" fallback - a neutral, on-brand tile (initial letter on
// the surface color) instead of a generic broken-image icon or a stock
// placeholder photo that doesn't match the tenant's own theme (spec §9).
export function productInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function formatPrice(price: string, currency = "TRY"): string {
  const amount = Number(price);
  if (Number.isNaN(amount)) {
    return price;
  }
  const symbol = currency === "TRY" ? "₺" : currency;
  return `${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)} ${symbol}`;
}

const PHOTO_ASPECT_CLASS: Record<StorefrontLayout["photoAspectRatio"], string> = {
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "16:9": "aspect-video",
  "3:4": "aspect-[3/4]",
};

export function photoAspectClassNameFor(ratio: StorefrontLayout["photoAspectRatio"]): string {
  return PHOTO_ASPECT_CLASS[ratio];
}

export function startingPrice(product: Product): string | null {
  if (!product.variants || product.variants.length === 0) {
    return null;
  }
  const prices = product.variants.map((v) => Number(v.price)).filter((n) => !Number.isNaN(n));
  if (prices.length === 0) {
    return null;
  }
  return formatPrice(Math.min(...prices).toString());
}

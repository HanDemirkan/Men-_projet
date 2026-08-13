import type { ComponentType } from "react";

// The shared shape every storefront building block (hero, category-nav,
// product-card, footer, info-block, and future blocks - campaigns/blog/
// gallery/reservations/reviews, see Sprint 7 architecture rules §7-8)
// registers under. This is what makes the system "marketplace-ready" while
// still living in code today: a plugin carries its own identity, a
// no-code-friendly Turkish label (never a raw code like "hero-variant-3"),
// a version, and a capability list a future compatibility check can read -
// without the renderer or builder ever needing to know a plugin exists
// until it's registered.
export interface StorefrontComponentPlugin<TProps> {
  code: string;
  label: string;
  version: number;
  capabilities: string[];
  Component: ComponentType<TProps>;
}

export function registryOptions<TProps>(
  registry: Record<string, StorefrontComponentPlugin<TProps>>,
): Array<{ value: string; label: string }> {
  return Object.values(registry).map((plugin) => ({ value: plugin.code, label: plugin.label }));
}

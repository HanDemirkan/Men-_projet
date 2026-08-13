import type { StorefrontConfig } from "@qr-platform/shared";

import type { BusinessProfile, Category, Menu, Product } from "./catalog";

// Mirrors apps/api's PublicStorefrontService response shapes 1:1 (Sprint
// 3B, table split in Sprint 7). `BusinessProfile` already matches
// PublicStorefrontService's `serializeTenant()` output - both are "the raw
// Tenant row minus the storefrontConfig relation" (which is never sent as-is
// since it would leak the unpublished draft; only the already-merged,
// published-only `storefrontConfig` field below is ever sent).
export type PublicTenant = BusinessProfile;

export type StorefrontMenuSummary = { id: string; name: string };

export interface StorefrontHome {
  tenant: PublicTenant;
  storefrontConfig: StorefrontConfig;
  menus: StorefrontMenuSummary[];
}

export type StorefrontMenuCategory = Category & { products: Product[] };
export type StorefrontMenu = Menu & { categories: StorefrontMenuCategory[] };

export interface StorefrontMenuPage {
  tenant: PublicTenant;
  storefrontConfig: StorefrontConfig;
  menus: StorefrontMenu[];
}

export interface StorefrontCategoryPage {
  tenant: PublicTenant;
  storefrontConfig: StorefrontConfig;
  category: Category & { products: Product[] };
}

export interface StorefrontProductPage {
  tenant: PublicTenant;
  storefrontConfig: StorefrontConfig;
  product: Product & { category: Category };
}

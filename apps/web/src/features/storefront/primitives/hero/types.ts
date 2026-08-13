import type { StorefrontLayout, StorefrontSections, StorefrontTheme } from "@qr-platform/shared";

import type { PublicTenant } from "@/types/storefront";

// Shared prop contract every hero primitive implements (spec §7's 6 hero
// types + Kapak/Logo/İşletme adı/Slogan/Açık-Kapalı/sections toggles). The
// heavier content (about/hours table/contact buttons/social icons) is NOT
// part of a hero - it's InfoBlockList (see components/InfoBlockList.tsx),
// rendered once below whichever hero is chosen, so switching hero style
// never duplicates that content.
export interface StorefrontHeroProps {
  tenant: PublicTenant;
  theme: StorefrontTheme;
  layout: StorefrontLayout;
  sections: StorefrontSections;
}

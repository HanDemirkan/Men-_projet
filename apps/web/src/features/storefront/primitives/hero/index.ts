import type { HeroStyle } from "@qr-platform/shared";
import dynamic from "next/dynamic";

import type { StorefrontHeroProps } from "./types";

import type { StorefrontComponentPlugin } from "@/features/storefront/registry/plugin-types";

export type { StorefrontHeroProps } from "./types";

// Registry, not a switch: adding a 7th hero tomorrow means adding one entry
// here - StorefrontRenderer and the builder never change (Sprint 7
// architecture rule §2/§10). Labels are the no-code Turkish names shown in
// the builder, never the internal code (rule §5).
//
// `next/dynamic` (not a static import) per component - spec §20's "Template
// kodlarını gerektiğinde lazy load et... kullanılmayan tüm template JS'lerini
// storefront'a yükleme": a static import here would bundle all 6 hero
// components into every storefront page load regardless of which one is
// actually selected. This was confirmed as a real, measurable problem (a
// production Lighthouse audit hit NO_FCP - the page never painted - once
// enough of these registries were statically imported together). `ssr: true`
// (the default) keeps server-rendering/SEO intact; only the *bundling* is
// deferred to a separate, on-demand chunk per hero.
export const HERO_REGISTRY: Record<HeroStyle, StorefrontComponentPlugin<StorefrontHeroProps>> = {
  "full-cover": {
    code: "full-cover",
    label: "Tam Kapak",
    version: 1,
    capabilities: ["cover", "logo", "tagline", "openStatus"],
    Component: dynamic(() => import("./FullCoverHero").then((m) => m.FullCoverHero)),
  },
  split: {
    code: "split",
    label: "Bölünmüş Kapak",
    version: 1,
    capabilities: ["cover", "logo", "tagline", "openStatus"],
    Component: dynamic(() => import("./SplitHero").then((m) => m.SplitHero)),
  },
  "minimal-header": {
    code: "minimal-header",
    label: "Minimal Başlık",
    version: 1,
    capabilities: ["logo", "tagline", "openStatus"],
    Component: dynamic(() => import("./MinimalHeaderHero").then((m) => m.MinimalHeaderHero)),
  },
  "centered-brand": {
    code: "centered-brand",
    label: "Ortalanmış Marka",
    version: 1,
    capabilities: ["cover", "logo", "tagline", "openStatus"],
    Component: dynamic(() => import("./CenteredBrandHero").then((m) => m.CenteredBrandHero)),
  },
  "dark-overlay": {
    code: "dark-overlay",
    label: "Koyu Karartmalı Kapak",
    version: 1,
    capabilities: ["cover", "logo", "tagline", "openStatus"],
    Component: dynamic(() => import("./DarkOverlayHero").then((m) => m.DarkOverlayHero)),
  },
  "image-info-card": {
    code: "image-info-card",
    label: "Görsel + Bilgi Kartı",
    version: 1,
    capabilities: ["cover", "logo", "tagline", "openStatus"],
    Component: dynamic(() => import("./ImageInfoCardHero").then((m) => m.ImageInfoCardHero)),
  },
};

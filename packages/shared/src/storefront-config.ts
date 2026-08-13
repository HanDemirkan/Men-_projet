// Single source of truth for the public storefront's visual/behavioral
// config - imported by apps/api (defaults + validation) and apps/web (QR
// Builder editor + live preview + the public storefront pages themselves).
// See docs/decisions/0009-storefront-theme-and-publishing.md and Sprint 7's
// template rewrite (docs/decisions/0011-storefront-template-system.md).
//
// Sprint 7 splits what used to be one flat `theme` object into two: `theme`
// now holds only colors + typography (what a business picks in "Renk ve
// Yazı"), `layout` holds the structural choices that used to be baked into
// 4 near-identical "templates" (hero type, cover height, category-nav
// style, product-card style, radius, shadow, background texture, button
// shape, footer style - what a business picks in "Menü Görünümü"). A
// template is now a named *default bundle* across these two independent
// axes plus a palette/typography pick, not a hardcoded page layout - see
// apps/web/src/features/storefront/registry/templates.ts for the
// component-level wiring (which React primitive renders each style code).
//
// `templateCode`/`templateVersion` are NOT part of this JSON shape - they're
// real columns on TenantStorefrontConfig (see packages/database's schema),
// so the API can query/index on them directly instead of reaching into JSON.

// Sprint 8: reduced from 8 templates to 3 - a Design Review of the original
// 8 found several too close to "same layout, different color" to count as
// genuinely distinct, and the spec explicitly asked for fewer, stronger
// templates over more, weaker ones. The removed 5 (dark-restaurant,
// traditional-restaurant, bakery, fast-food, colorful-dessert) are gone from
// the picker; their primitives (hero/nav/card components) stay in the
// registry and remain manually selectable via the Layout step, since
// Template vs. Layout independence is a standing architectural rule, not
// something a curated-preset reduction should break.
export type TemplateCode = "modern-cafe" | "premium-restaurant" | "minimal-coffee";

export const TEMPLATE_CODES: TemplateCode[] = ["modern-cafe", "premium-restaurant", "minimal-coffee"];

export type ColorPaletteCode =
  | "coffee-brown"
  | "olive-green"
  | "deep-navy"
  | "burgundy"
  | "warm-beige"
  | "charcoal"
  | "orange-energy"
  | "pastel-dessert"
  | "custom";

export type StorefrontTypographyPairing =
  | "inter-inter"
  | "playfair-inter"
  | "poppins-inter"
  | "dmsans-dmsans"
  | "merriweather-sourcesans"
  | "montserrat-opensans";

export type TypeScaleSize = "sm" | "md" | "lg";
export type LetterSpacingScale = "tight" | "normal" | "wide";

export type HeroStyle = "full-cover" | "split" | "minimal-header" | "centered-brand" | "dark-overlay" | "image-info-card";
export type CoverHeight = "none" | "sm" | "md" | "lg" | "xl";
export type LogoPosition = "top-left" | "centered" | "bottom-left" | "floating-card";
export type CategoryNavStyle = "sticky-tabs" | "horizontal-pills" | "vertical-list" | "image-cards";
export type ProductCardStyle = "horizontal-compact" | "large-image" | "minimal-text" | "grid-card" | "premium-editorial";
export type PhotoAspectRatio = "1:1" | "4:3" | "16:9" | "3:4";
export type BorderRadiusScale = "none" | "sm" | "md" | "lg" | "xl";
export type ShadowIntensity = "none" | "soft" | "hard";
export type BackgroundTexture = "none" | "subtle-gradient" | "subtle-noise" | "diagonal-pattern";
export type ButtonShape = "square" | "rounded" | "pill" | "outline";
export type FooterStyle = "minimal" | "detailed" | "social-band";

export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface StorefrontColorSet {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
}

export interface StorefrontTheme extends StorefrontColorSet {
  paletteCode: ColorPaletteCode;
  typographyPairing: StorefrontTypographyPairing;
  headingSize: TypeScaleSize;
  bodySize: TypeScaleSize;
  letterSpacing: LetterSpacingScale;
}

export interface StorefrontLayout {
  hero: HeroStyle;
  coverHeight: CoverHeight;
  logoPosition: LogoPosition;
  categoryNav: CategoryNavStyle;
  productCard: ProductCardStyle;
  photoAspectRatio: PhotoAspectRatio;
  borderRadius: BorderRadiusScale;
  shadow: ShadowIntensity;
  backgroundTexture: BackgroundTexture;
  buttonShape: ButtonShape;
  footerStyle: FooterStyle;
}

export interface StorefrontSections {
  cover: boolean;
  logo: boolean;
  about: boolean;
  workingHours: boolean;
  contact: boolean;
  whatsapp: boolean;
  phone: boolean;
  googleMaps: boolean;
  social: boolean;
  menus: boolean;
}

export interface StorefrontQrSettings {
  errorCorrectionLevel: QrErrorCorrectionLevel;
  includeLogo: boolean;
}

export interface StorefrontSeo {
  title: string | null;
  description: string | null;
}

export interface StorefrontConfig {
  theme: StorefrontTheme;
  layout: StorefrontLayout;
  sections: StorefrontSections;
  qr: StorefrontQrSettings;
  seo: StorefrontSeo;
  footerText: string | null;
  faviconMediaId: string | null;
  ogImageMediaId: string | null;
}

const DEFAULT_SECTIONS: StorefrontSections = {
  cover: true,
  logo: true,
  about: true,
  workingHours: true,
  contact: true,
  whatsapp: true,
  phone: true,
  googleMaps: true,
  social: true,
  menus: true,
};

const DEFAULT_QR: StorefrontQrSettings = {
  errorCorrectionLevel: "Q",
  includeLogo: false,
};

const DEFAULT_SEO: StorefrontSeo = {
  title: null,
  description: null,
};

// 8 ready-made palettes (spec §4). Every color pair actually used for
// text-on-background (`text`/`mutedText` vs `background`, and the
// auto-computed button foreground vs `primaryColor`) is chosen to clear
// WCAG AA (4.5:1) - verified with packages/shared/src/color-contrast.ts,
// not just eyeballed (see apps/web's registry test that asserts this for
// every palette, so a future edit here can't silently regress it).
export const COLOR_PALETTES: Record<Exclude<ColorPaletteCode, "custom">, StorefrontColorSet> = {
  "coffee-brown": {
    primaryColor: "#6F4E37",
    secondaryColor: "#C08552",
    accentColor: "#A9746E",
    background: "#FFF8F3",
    surface: "#FFFFFF",
    text: "#3B2A20",
    mutedText: "#6B5643",
    border: "#E8D9CC",
  },
  "olive-green": {
    primaryColor: "#5B6B3F",
    secondaryColor: "#8A9A5B",
    accentColor: "#C9A63C",
    background: "#FAFAF2",
    surface: "#FFFFFF",
    text: "#2E3521",
    mutedText: "#5B6349",
    border: "#DDE0C8",
  },
  "deep-navy": {
    primaryColor: "#1B2A4A",
    secondaryColor: "#3E5C89",
    accentColor: "#B8860B",
    background: "#F5F7FA",
    surface: "#FFFFFF",
    text: "#101826",
    mutedText: "#4B5670",
    border: "#D7DEE8",
  },
  burgundy: {
    primaryColor: "#6B1E2B",
    secondaryColor: "#9C3B4A",
    accentColor: "#A8842F",
    background: "#FBF6F2",
    surface: "#FFFFFF",
    text: "#2E1015",
    mutedText: "#6B444A",
    border: "#E7D6D2",
  },
  "warm-beige": {
    primaryColor: "#8C6D4F",
    secondaryColor: "#B79571",
    accentColor: "#A0522D",
    background: "#FBF7F0",
    surface: "#FFFFFF",
    text: "#3A2E20",
    mutedText: "#6B5C49",
    border: "#E5DCCB",
  },
  charcoal: {
    primaryColor: "#D9A94E",
    secondaryColor: "#A8A8A2",
    accentColor: "#E0654A",
    background: "#171717",
    surface: "#232323",
    text: "#F2F2F0",
    mutedText: "#B8B8B3",
    border: "#3A3A3A",
  },
  "orange-energy": {
    primaryColor: "#D6500C",
    secondaryColor: "#C77E00",
    accentColor: "#B8202F",
    background: "#FFFDF9",
    surface: "#FFFFFF",
    text: "#2B1B12",
    mutedText: "#6B4E3B",
    border: "#F3DCC8",
  },
  "pastel-dessert": {
    primaryColor: "#C1618A",
    secondaryColor: "#5C82AD",
    accentColor: "#B08F1E",
    background: "#FFFBFC",
    surface: "#FFFFFF",
    text: "#4A2E3A",
    mutedText: "#7A5C68",
    border: "#F2DCE4",
  },
};

// 6 pairings (spec §5). `label` is the exact Turkish-picker display text;
// `headingFont`/`bodyFont` are the real Google Font family names apps/web's
// registry loads via next/font/google.
export const TYPOGRAPHY_PAIRINGS: Record<
  StorefrontTypographyPairing,
  { label: string; headingFont: string; bodyFont: string }
> = {
  "inter-inter": { label: "Inter + Inter", headingFont: "Inter", bodyFont: "Inter" },
  "playfair-inter": { label: "Playfair Display + Inter", headingFont: "Playfair Display", bodyFont: "Inter" },
  "poppins-inter": { label: "Poppins + Inter", headingFont: "Poppins", bodyFont: "Inter" },
  "dmsans-dmsans": { label: "DM Sans + DM Sans", headingFont: "DM Sans", bodyFont: "DM Sans" },
  "merriweather-sourcesans": { label: "Merriweather + Source Sans", headingFont: "Merriweather", bodyFont: "Source Sans 3" },
  "montserrat-opensans": { label: "Montserrat + Open Sans", headingFont: "Montserrat", bodyFont: "Open Sans" },
};

export interface TemplateDefaults {
  code: TemplateCode;
  version: number;
  name: string;
  description: string;
  useCase: string;
  paletteCode: Exclude<ColorPaletteCode, "custom">;
  typographyPairing: StorefrontTypographyPairing;
  layout: StorefrontLayout;
}

// The 3 ready-made templates (Sprint 8: reduced from 8 - see the
// TemplateCode comment above). Each one still differs on every axis the
// spec calls out (hero, cover height, logo position, nav, card, photo
// ratio, radius, shadow, background texture, button shape, footer, palette,
// typography) - not just color: 3 different hero components (split/
// centered-brand/minimal-header), 3 different nav components (sticky-tabs/
// vertical-list/horizontal-pills), 3 different card components (grid-card/
// premium-editorial/minimal-text). The other hero/nav/card primitives this
// doesn't use stay in their registries, selectable via the Layout step.
export const TEMPLATE_DEFAULTS: Record<TemplateCode, TemplateDefaults> = {
  "modern-cafe": {
    code: "modern-cafe",
    version: 1,
    name: "Modern Cafe",
    description: "Sıcak, fotoğraf ağırlıklı bir kafe deneyimi - tam kapak görsel ve yuvarlak, foto-öncelikli kartlar.",
    useCase: "Kafeler ve kahve dükkanları için",
    paletteCode: "coffee-brown",
    typographyPairing: "poppins-inter",
    layout: {
      hero: "full-cover",
      coverHeight: "xl",
      logoPosition: "bottom-left",
      categoryNav: "sticky-tabs",
      productCard: "grid-card",
      photoAspectRatio: "1:1",
      borderRadius: "lg",
      shadow: "soft",
      backgroundTexture: "subtle-gradient",
      buttonShape: "pill",
      footerStyle: "detailed",
    },
  },
  "premium-restaurant": {
    code: "premium-restaurant",
    version: 1,
    name: "Premium Restaurant",
    description: "Sofistike, geniş fotoğraflı bir kapak ve editoryal ürün kartlarıyla üst segment görünüm.",
    useCase: "Fine-dining ve özel davet mekanları için",
    paletteCode: "deep-navy",
    typographyPairing: "playfair-inter",
    layout: {
      hero: "dark-overlay",
      coverHeight: "xl",
      logoPosition: "centered",
      categoryNav: "vertical-list",
      productCard: "premium-editorial",
      photoAspectRatio: "4:3",
      borderRadius: "sm",
      shadow: "soft",
      backgroundTexture: "none",
      buttonShape: "outline",
      footerStyle: "detailed",
    },
  },
  "minimal-coffee": {
    code: "minimal-coffee",
    version: 1,
    name: "Minimal Coffee",
    description: "Kapaksız, sade başlık ve düz metin kartlarıyla dikkat dağıtmayan bir görünüm.",
    useCase: "Az ürünlü, sade menüler için",
    paletteCode: "olive-green",
    typographyPairing: "inter-inter",
    layout: {
      hero: "minimal-header",
      coverHeight: "none",
      logoPosition: "centered",
      categoryNav: "horizontal-pills",
      productCard: "minimal-text",
      photoAspectRatio: "1:1",
      borderRadius: "sm",
      shadow: "none",
      backgroundTexture: "none",
      buttonShape: "outline",
      footerStyle: "minimal",
    },
  },
};

export const DEFAULT_TEMPLATE_CODE: TemplateCode = "modern-cafe";

export function buildDefaultTheme(templateCode: TemplateCode): StorefrontTheme {
  const def = TEMPLATE_DEFAULTS[templateCode];
  const palette = COLOR_PALETTES[def.paletteCode];
  return {
    ...palette,
    paletteCode: def.paletteCode,
    typographyPairing: def.typographyPairing,
    headingSize: "md",
    bodySize: "md",
    letterSpacing: "normal",
  };
}

export function buildDefaultStorefrontConfig(templateCode: TemplateCode = DEFAULT_TEMPLATE_CODE): StorefrontConfig {
  const def = TEMPLATE_DEFAULTS[templateCode];
  return {
    theme: buildDefaultTheme(templateCode),
    layout: { ...def.layout },
    sections: { ...DEFAULT_SECTIONS },
    qr: { ...DEFAULT_QR },
    seo: { ...DEFAULT_SEO },
    footerText: null,
    faviconMediaId: null,
    ogImageMediaId: null,
  };
}

// Merges a partial/stored config (possibly missing newer fields, e.g. a
// tenant customized before a field existed) over that template's own
// defaults - so reads never need a null-check for every nested field. Keyed
// by templateCode (unlike the old single-Classic-default version) since
// every template now has genuinely different defaults.
export function mergeStorefrontConfig(
  templateCode: TemplateCode,
  stored: Partial<StorefrontConfig> | null | undefined,
): StorefrontConfig {
  const base = buildDefaultStorefrontConfig(templateCode);

  if (!stored) {
    return base;
  }

  return {
    theme: { ...base.theme, ...stored.theme },
    layout: { ...base.layout, ...stored.layout },
    sections: { ...base.sections, ...stored.sections },
    qr: { ...base.qr, ...stored.qr },
    seo: { ...base.seo, ...stored.seo },
    footerText: stored.footerText ?? base.footerText,
    faviconMediaId: stored.faviconMediaId ?? base.faviconMediaId,
    ogImageMediaId: stored.ogImageMediaId ?? base.ogImageMediaId,
  };
}

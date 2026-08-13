import type { StorefrontLayout, StorefrontTheme } from "@qr-platform/shared";
import { bestForeground } from "@qr-platform/shared";
import type { CSSProperties } from "react";

import { resolveTypographyCssVars } from "./registry/typography";

// Converts the tenant's chosen theme (colors + typography) into CSS custom
// properties, so the same primitive components (used both by the real
// public storefront and the QR Builder's live preview pane) can restyle
// themselves purely from props - no per-template component variants. Sprint
// 7 split what used to be one flat `theme` object into `theme` (this file's
// first half) and `layout` (structural choices, second half) - see
// packages/shared/src/storefront-config.ts's header comment.
export function themeToCssVars(theme: StorefrontTheme): CSSProperties {
  const { headingFontVar, bodyFontVar } = resolveTypographyCssVars(theme.typographyPairing);

  return {
    "--sf-primary": theme.primaryColor,
    "--sf-secondary": theme.secondaryColor,
    "--sf-accent": theme.accentColor,
    "--sf-background": theme.background,
    "--sf-surface": theme.surface,
    "--sf-text": theme.text,
    "--sf-muted-text": theme.mutedText,
    "--sf-border": theme.border,
    "--sf-font-heading": headingFontVar,
    "--sf-font-body": bodyFontVar,
    // Auto-computed (spec §4 "Otomatik foreground rengi hesapla") - never
    // hardcode white/black text on a themed background, since a light
    // palette's primary and a dark palette's primary need opposite text.
    "--sf-primary-foreground": bestForeground(theme.primaryColor),
    "--sf-secondary-foreground": bestForeground(theme.secondaryColor),
    "--sf-accent-foreground": bestForeground(theme.accentColor),
  } as CSSProperties;
}

const HEADING_SIZE_CLASS: Record<StorefrontTheme["headingSize"], string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

const BODY_SIZE_CLASS: Record<StorefrontTheme["bodySize"], string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

const LETTER_SPACING_CLASS: Record<StorefrontTheme["letterSpacing"], string> = {
  tight: "tracking-tight",
  normal: "tracking-normal",
  wide: "tracking-wide",
};

export function headingSizeClassName(theme: StorefrontTheme): string {
  return `${HEADING_SIZE_CLASS[theme.headingSize]} ${LETTER_SPACING_CLASS[theme.letterSpacing]}`;
}

export function bodySizeClassName(theme: StorefrontTheme): string {
  return `${BODY_SIZE_CLASS[theme.bodySize]} ${LETTER_SPACING_CLASS[theme.letterSpacing]}`;
}

// --- Layout (structural, per-template default, independently overridable) ---

const RADIUS_VALUE: Record<StorefrontLayout["borderRadius"], string> = {
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "16px",
  xl: "24px",
};

export function layoutToCssVars(layout: StorefrontLayout): CSSProperties {
  return {
    "--sf-radius": RADIUS_VALUE[layout.borderRadius],
  } as CSSProperties;
}

const SHADOW_CLASS: Record<StorefrontLayout["shadow"], string> = {
  none: "shadow-none",
  soft: "shadow-md",
  hard: "shadow-[4px_4px_0_0_rgba(0,0,0,0.9)]",
};

export function shadowClassName(layout: StorefrontLayout): string {
  return SHADOW_CLASS[layout.shadow];
}

const BUTTON_SHAPE_CLASS: Record<StorefrontLayout["buttonShape"], string> = {
  square: "rounded-none",
  rounded: "rounded-md",
  pill: "rounded-full",
  outline: "rounded-md border-2 bg-transparent",
};

export function buttonShapeClassName(layout: StorefrontLayout): string {
  return BUTTON_SHAPE_CLASS[layout.buttonShape];
}

const PHOTO_ASPECT_CLASS: Record<StorefrontLayout["photoAspectRatio"], string> = {
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "16:9": "aspect-video",
  "3:4": "aspect-[3/4]",
};

export function photoAspectClassName(layout: StorefrontLayout): string {
  return PHOTO_ASPECT_CLASS[layout.photoAspectRatio];
}

const COVER_HEIGHT_CLASS: Record<StorefrontLayout["coverHeight"], string> = {
  none: "h-0",
  sm: "h-32",
  md: "h-48",
  lg: "h-64",
  xl: "h-80",
};

export function coverHeightClassName(layout: StorefrontLayout): string {
  return COVER_HEIGHT_CLASS[layout.coverHeight];
}

// Pure-CSS textures (no image assets, no asset pipeline needed) - subtle by
// design (spec §11 explicitly forbids distracting effects), applied as an
// inline background-image alongside the flat --sf-background color.
export function backgroundTextureStyle(theme: StorefrontTheme, layout: StorefrontLayout): CSSProperties {
  switch (layout.backgroundTexture) {
    case "subtle-gradient":
      return { backgroundImage: `linear-gradient(180deg, ${theme.surface} 0%, ${theme.background} 320px)` };
    case "subtle-noise":
      return {
        backgroundImage: `radial-gradient(${theme.border} 0.5px, transparent 0.5px)`,
        backgroundSize: "12px 12px",
      };
    case "diagonal-pattern":
      return {
        backgroundImage: `repeating-linear-gradient(135deg, ${theme.surface} 0px, ${theme.surface} 10px, ${theme.background} 10px, ${theme.background} 20px)`,
      };
    case "none":
    default:
      return {};
  }
}

const CARD_SURFACE_CLASS = "border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)]";

// Every product/category card and info block shares this one surface
// treatment (border + surface color) - shadow intensity layers on top via
// shadowClassName() separately, matching the old cardStyle/shadowStyle split
// but keyed off `layout` now instead of `theme`.
export function cardSurfaceClassName(): string {
  return CARD_SURFACE_CLASS;
}

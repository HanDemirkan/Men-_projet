// Single source of truth for animation timing across the whole product -
// consumed directly here by shared components (Dialog/Drawer/Toast/Sidebar)
// and re-exported through apps/web/src/config/motion.ts for app-level
// pages (landing, login, storefront). Nothing else should hardcode a
// duration/easing/spring value - see Sprint 6.
// Sprint 8 performance budget: every animation in the product must land in
// 120-220ms, so `slow` (the longest token that exists) is capped at 220ms -
// previously 300ms, which a real user-feedback pass flagged as reading like
// a "loading screen" delay rather than a quick transition.
export const duration = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.22,
} as const;

export const easing = {
  // General-purpose, symmetric - the default for anything that isn't
  // specifically an enter or an exit (e.g. a hover color change).
  standard: [0.4, 0, 0.2, 1] as const,
  // Decelerates into place - entrances (fade/slide in, dialog open).
  enter: [0.16, 1, 0.3, 1] as const,
  // Accelerates away - exits (fade/slide out, dialog close).
  exit: [0.4, 0, 1, 1] as const,
} as const;

export const spring = {
  // Gentle settle - content reveals, layout shifts.
  soft: { type: "spring", stiffness: 200, damping: 24 } as const,
  // Quick, decisive - button/toggle feedback, drawer slide.
  snappy: { type: "spring", stiffness: 380, damping: 30 } as const,
} as const;

export const stagger = {
  small: 0.04,
  medium: 0.08,
} as const;

// App-level Framer Motion config: composed variants (fadeInUp, stagger...)
// built on top of the raw tokens in packages/ui/src/motion/tokens.ts, which
// is the single source of truth for the actual duration/easing/spring
// numbers - see that file's own comment. Nothing here (or anywhere else)
// should invent its own duration/easing value.
import { duration, easing, spring, stagger } from "@qr-platform/ui";

export { duration, easing, spring, stagger };

// Back-compat names - kept so existing landing page components don't need
// touching; new code should prefer `duration`/`easing` above.
export const MOTION_DURATION = duration;
export const MOTION_EASE = easing;

// A single element fading/rising into place - the default for section and
// card entrances. Kept subtle on purpose (small y-offset, short duration).
export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: duration.slow, ease: easing.enter },
};

// Stagger helper for a list/grid of children entering together.
export function staggerChildren(staggerDelay: number = stagger.small) {
  return {
    initial: "hidden",
    whileInView: "visible",
    viewport: { once: true, margin: "-80px" },
    transition: { staggerChildren: staggerDelay },
  };
}

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: easing.enter },
  },
};

// A page-level transition (route change) - fade + a small rise, short
// enough not to feel like a loading screen. See PageTransition.tsx.
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: duration.normal, ease: easing.standard },
};

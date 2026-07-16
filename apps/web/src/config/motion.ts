// Shared Framer Motion timing so every animation in the product shares the
// same rhythm, instead of each component inventing its own duration/easing.
export const MOTION_DURATION = {
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
} as const;

export const MOTION_EASE = {
  enter: [0.16, 1, 0.3, 1] as const, // ease-out, decelerates into place
  exit: [0.4, 0, 1, 1] as const, // ease-in, accelerates away
};

// A single element fading/rising into place - the default for section and
// card entrances. Kept subtle on purpose (small y-offset, short duration).
export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: MOTION_DURATION.slow, ease: MOTION_EASE.enter },
};

// Stagger helper for a list/grid of children entering together.
export function staggerChildren(staggerDelay = 0.06) {
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
    transition: { duration: MOTION_DURATION.slow, ease: MOTION_EASE.enter },
  },
};

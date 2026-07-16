// Documented z-index contract. Use these instead of ad-hoc `z-*` values so
// overlay layers stay predictable as more of them are added.
export const Z_INDEX = {
  sticky: 30,
  dropdown: 40,
  overlay: 50,
  modal: 50,
  popover: 50,
  toast: 100,
} as const;

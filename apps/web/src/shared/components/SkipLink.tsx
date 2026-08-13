// Visually hidden until focused (standard skip-link pattern) - the first
// focusable element on every page, letting keyboard/screen-reader users
// jump straight past the sidebar/header repetition to the actual content.
// Plain CSS, no JS: an anchor to `#main-content` combined with that
// element's own `tabIndex={-1}` (see each layout) is enough for focus to
// land there on activation.
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-md"
    >
      İçeriğe geç
    </a>
  );
}

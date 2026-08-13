import type { StorefrontCategoryNavProps } from "./types";

// Spec §8 "Sticky Tabs" - horizontal scroll on mobile (native overflow, no
// extra JS needed). `aria-current` gives the active indicator without
// relying on color alone (spec §19). Stickiness itself is NOT set here -
// StorefrontRenderer wraps this (and the search bar above it) in one shared
// `sticky top-0` shell, so the two don't independently pin to the same y=0
// and overlap on scroll.
export function StickyTabsNav({ categories, activeCategoryId, onSelect }: StorefrontCategoryNavProps) {
  return (
    <nav
      aria-label="Kategoriler"
      className="flex gap-1 overflow-x-auto border-b px-3 py-2"
      style={{ backgroundColor: "var(--sf-background)", borderColor: "var(--sf-border)" }}
    >
      {categories.map((category) => {
        const active = category.id === activeCategoryId;
        return (
          <button
            key={category.id}
            type="button"
            aria-current={active ? "true" : undefined}
            onClick={() => onSelect(category.id)}
            className="shrink-0 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors duration-fast"
            style={{
              color: active ? "var(--sf-primary)" : "var(--sf-muted-text)",
              borderBottom: active ? "2px solid var(--sf-primary)" : "2px solid transparent",
            }}
          >
            {category.name}
            <span className="ml-1 text-xs" style={{ color: "var(--sf-muted-text)" }}>
              ({category.productCount})
            </span>
          </button>
        );
      })}
    </nav>
  );
}

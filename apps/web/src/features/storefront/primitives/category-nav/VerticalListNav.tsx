import type { StorefrontCategoryNavProps } from "./types";

// Spec §8 "Vertical Category List" - a side rail on desktop (premium-restaurant's
// default, fits its editorial layout); on mobile there's no room for a
// sidebar so it degrades to the same horizontal scroll row as the pill nav.
export function VerticalListNav({ categories, activeCategoryId, onSelect }: StorefrontCategoryNavProps) {
  return (
    <nav aria-label="Kategoriler" className="flex gap-1 overflow-x-auto px-3 py-3 sm:flex-col sm:overflow-visible sm:px-0">
      {categories.map((category) => {
        const active = category.id === activeCategoryId;
        return (
          <button
            key={category.id}
            type="button"
            aria-current={active ? "true" : undefined}
            onClick={() => onSelect(category.id)}
            className="shrink-0 whitespace-nowrap px-4 py-2.5 text-left text-sm font-medium transition-colors duration-fast sm:w-full"
            style={{
              color: active ? "var(--sf-primary)" : "var(--sf-text)",
              backgroundColor: active ? "var(--sf-surface)" : "transparent",
              borderLeft: active ? "3px solid var(--sf-primary)" : "3px solid transparent",
            }}
          >
            {category.name}
          </button>
        );
      })}
    </nav>
  );
}

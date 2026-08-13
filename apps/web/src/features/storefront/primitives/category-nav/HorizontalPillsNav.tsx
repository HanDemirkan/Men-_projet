import type { StorefrontCategoryNavProps } from "./types";

// Spec §8 "Horizontal Pills" - rounded pill buttons, not sticky, softer/more
// casual than tabs (minimal-coffee's default).
export function HorizontalPillsNav({ categories, activeCategoryId, onSelect }: StorefrontCategoryNavProps) {
  return (
    <nav aria-label="Kategoriler" className="flex gap-2 overflow-x-auto px-3 py-3">
      {categories.map((category) => {
        const active = category.id === activeCategoryId;
        return (
          <button
            key={category.id}
            type="button"
            aria-current={active ? "true" : undefined}
            onClick={() => onSelect(category.id)}
            className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors duration-fast"
            style={{
              backgroundColor: active ? "var(--sf-primary)" : "var(--sf-surface)",
              color: active ? "var(--sf-primary-foreground)" : "var(--sf-text)",
              border: active ? "none" : "1px solid var(--sf-border)",
            }}
          >
            {category.name}
          </button>
        );
      })}
    </nav>
  );
}

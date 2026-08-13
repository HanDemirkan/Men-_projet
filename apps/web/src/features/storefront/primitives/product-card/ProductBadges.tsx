import { PRODUCT_TAG_LABELS } from "@qr-platform/shared";
import type { ProductTag } from "@qr-platform/shared";
import { ChefHat, Flame, Leaf, Sparkles, WheatOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Shared badge row - product cards AND the product detail sheet render the
// exact same badges from the exact same data (isFeatured + tags), so a
// business setting a tag in one place is guaranteed consistent everywhere
// it's shown, not three near-identical hand-rolled badge lists that could
// drift apart.
const TAG_ICON: Record<ProductTag, LucideIcon> = {
  vegan: Leaf,
  vegetarian: Leaf,
  "gluten-free": WheatOff,
  spicy: Flame,
  new: Sparkles,
  "chefs-pick": ChefHat,
};

export interface ProductBadgesProps {
  isFeatured: boolean;
  tags: ProductTag[];
  size?: "sm" | "md";
}

export function ProductBadges({ isFeatured, tags, size = "sm" }: ProductBadgesProps) {
  if (!isFeatured && tags.length === 0) {
    return null;
  }

  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isFeatured ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-medium ${padding}`}
          style={{ backgroundColor: "color-mix(in srgb, var(--sf-accent) 16%, transparent)", color: "var(--sf-accent)" }}
        >
          <Sparkles className={iconSize} aria-hidden="true" />
          Popüler
        </span>
      ) : null}
      {tags.map((tag) => {
        const Icon = TAG_ICON[tag];
        return (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 rounded-full font-medium ${padding}`}
            style={{ backgroundColor: "var(--sf-background)", color: "var(--sf-muted-text)", border: "1px solid var(--sf-border)" }}
          >
            <Icon className={iconSize} aria-hidden="true" />
            {PRODUCT_TAG_LABELS[tag]}
          </span>
        );
      })}
    </div>
  );
}

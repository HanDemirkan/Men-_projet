import Image from "next/image";

import type { StorefrontCategoryNavProps } from "./types";

import { mediaFileUrl } from "@/services/media.service";

// Spec §8 "Image Category Cards" - a round photo per category (bakery's
// default) when categories have their own images; falls back to an
// initial-letter tile when a category has none, never a broken/placeholder
// image (spec §9's "kötü placeholder gösterme" applies here too).
export function ImageCardsNav({ categories, activeCategoryId, onSelect }: StorefrontCategoryNavProps) {
  return (
    <nav aria-label="Kategoriler" className="flex gap-4 overflow-x-auto px-4 py-3">
      {categories.map((category) => {
        const active = category.id === activeCategoryId;
        return (
          <button
            key={category.id}
            type="button"
            aria-current={active ? "true" : undefined}
            onClick={() => onSelect(category.id)}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <div
              className="relative h-16 w-16 overflow-hidden rounded-full transition-[box-shadow] duration-fast"
              style={{ boxShadow: active ? "0 0 0 3px var(--sf-primary)" : "0 0 0 1px var(--sf-border)" }}
            >
              {category.imageId ? (
                <Image src={mediaFileUrl(category.imageId)} alt="" fill sizes="64px" className="object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-lg font-semibold"
                  style={{ backgroundColor: "var(--sf-surface)", color: "var(--sf-muted-text)" }}
                >
                  {category.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span
              className="max-w-[72px] truncate text-xs font-medium"
              style={{ color: active ? "var(--sf-primary)" : "var(--sf-text)" }}
            >
              {category.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

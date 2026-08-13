import Link from "next/link";

import { formatPrice, startingPrice } from "./types";
import type { StorefrontProductCardProps } from "./types";

// "Compact" card system (Minimal Coffee's default) - no photo, dense list
// rhythm for a fast-scan menu (coffee/bar style). Still shows what the
// review flagged as missing elsewhere - a real secondary line and badges -
// but at a tightness a photo-led card can't reach, per its own brief.
export function MinimalTextCard({ product, href }: StorefrontProductCardProps) {
  const price = startingPrice(product) ?? formatPrice(product.price);

  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 py-3 transition-opacity duration-fast active:opacity-70"
      style={{ borderBottom: "1px solid var(--sf-border)" }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline gap-1.5">
          <span className="truncate font-[family-name:var(--sf-font-heading)] text-[15px] font-medium" style={{ color: "var(--sf-text)" }}>
            {product.name}
          </span>
          {product.isFeatured ? (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--sf-accent)" }}>
              Popüler
            </span>
          ) : null}
        </span>
        {product.shortDescription ? (
          <span className="truncate font-[family-name:var(--sf-font-body)] text-xs" style={{ color: "var(--sf-muted-text)" }}>
            {product.shortDescription}
          </span>
        ) : null}
        {!product.isAvailable ? (
          <span className="text-xs font-medium" style={{ color: "var(--sf-accent)" }}>
            Stokta yok
          </span>
        ) : null}
      </div>
      <span className="shrink-0 font-[family-name:var(--sf-font-body)] text-sm font-medium" style={{ color: "var(--sf-text)" }}>
        {price}
      </span>
    </Link>
  );
}

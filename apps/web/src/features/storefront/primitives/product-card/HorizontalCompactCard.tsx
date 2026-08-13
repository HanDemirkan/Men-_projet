import { Clock, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { formatPrice, productInitial, startingPrice } from "./types";
import type { StorefrontProductCardProps } from "./types";

import { mediaFileUrl } from "@/services/media.service";

// Spec §9 "Horizontal Compact" - small square photo left, text right, fits
// many items per screen. Not one of the 3 curated templates' default
// (Sprint 8), but stays selectable via the Layout step.
export function HorizontalCompactCard({ product, layout, href }: StorefrontProductCardProps) {
  const price = startingPrice(product) ?? formatPrice(product.price);

  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 transition-transform duration-fast ease-standard active:scale-[0.98]"
      style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border)", borderRadius: "var(--sf-radius)" }}
    >
      <div className={`relative w-16 shrink-0 overflow-hidden ${layout.photoAspectRatio === "1:1" ? "aspect-square" : "aspect-square"}`} style={{ borderRadius: "var(--sf-radius)" }}>
        {product.imageId ? (
          <Image src={mediaFileUrl(product.imageId)} alt={product.name} fill sizes="64px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold" style={{ backgroundColor: "var(--sf-background)", color: "var(--sf-muted-text)" }}>
            {productInitial(product.name)}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-[family-name:var(--sf-font-heading)] text-sm font-semibold" style={{ color: "var(--sf-text)" }}>
            {product.name}
          </span>
          {product.isFeatured ? <Star className="h-3.5 w-3.5 shrink-0 fill-current" style={{ color: "var(--sf-accent)" }} aria-label="Öne çıkan ürün" /> : null}
        </div>
        {product.shortDescription ? (
          <p className="truncate text-xs" style={{ color: "var(--sf-muted-text)" }}>
            {product.shortDescription}
          </p>
        ) : null}
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--sf-muted-text)" }}>
          {!product.isAvailable ? <span className="font-medium" style={{ color: "var(--sf-accent)" }}>Stokta yok</span> : null}
          {product.preparationTime ? (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {product.preparationTime} dk
            </span>
          ) : null}
        </div>
      </div>

      <span className="shrink-0 font-[family-name:var(--sf-font-heading)] text-sm font-semibold" style={{ color: "var(--sf-primary)" }}>
        {price}
      </span>
    </Link>
  );
}

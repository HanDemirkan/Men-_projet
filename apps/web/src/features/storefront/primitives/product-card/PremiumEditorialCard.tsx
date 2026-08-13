import Image from "next/image";
import Link from "next/link";

import { ProductBadges } from "./ProductBadges";
import { formatPrice, photoAspectClassNameFor, productInitial, startingPrice } from "./types";
import type { StorefrontProductCardProps } from "./types";

import { mediaFileUrl } from "@/services/media.service";

// "Editorial" card system (Fine Dining's default) - asymmetric magazine-page
// layout: photo and text share the row, generous whitespace, a dotted price
// leader instead of a plain inline number for that printed-menu feel.
export function PremiumEditorialCard({ product, layout, theme, href }: StorefrontProductCardProps) {
  const price = startingPrice(product) ?? formatPrice(product.price);

  return (
    <Link href={href} className="group flex gap-5 py-6" style={{ borderBottom: "1px solid var(--sf-border)" }}>
      <div
        className={`relative w-32 shrink-0 overflow-hidden ${photoAspectClassNameFor(layout.photoAspectRatio)}`}
        style={{ borderRadius: "var(--sf-radius)" }}
      >
        {product.imageId ? (
          <Image
            src={mediaFileUrl(product.imageId)}
            alt={product.name}
            fill
            sizes="128px"
            className="object-cover transition-transform duration-normal ease-standard group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-xl font-semibold"
            style={{ backgroundColor: "var(--sf-surface)", color: "var(--sf-muted-text)" }}
          >
            {productInitial(product.name)}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h3
            className="font-[family-name:var(--sf-font-heading)] text-lg font-semibold"
            style={{ color: "var(--sf-text)", letterSpacing: theme.letterSpacing === "wide" ? "0.02em" : undefined }}
          >
            {product.name}
          </h3>
          {/* A dotted leader between name and price - a real print-menu
              convention, not decoration for its own sake. */}
          <span className="hidden min-w-8 flex-1 border-b border-dotted sm:block" style={{ borderColor: "var(--sf-border)" }} aria-hidden="true" />
          <span className="shrink-0 font-[family-name:var(--sf-font-heading)] text-base font-medium" style={{ color: "var(--sf-primary)" }}>
            {price}
          </span>
        </div>
        {product.shortDescription ? (
          <p className="font-[family-name:var(--sf-font-body)] text-sm leading-relaxed" style={{ color: "var(--sf-muted-text)" }}>
            {product.shortDescription}
          </p>
        ) : null}
        <div className="flex items-center gap-3">
          <ProductBadges isFeatured={product.isFeatured} tags={product.tags} size="sm" />
          {!product.isAvailable ? (
            <span className="text-xs font-medium" style={{ color: "var(--sf-accent)" }}>
              Stokta yok
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

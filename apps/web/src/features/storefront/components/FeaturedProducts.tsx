import Image from "next/image";
import Link from "next/link";

import { ProductBadges } from "../primitives/product-card/ProductBadges";
import { formatPrice, productInitial, startingPrice } from "../primitives/product-card/types";

import { mediaFileUrl } from "@/services/media.service";
import type { Product } from "@/types/catalog";

export interface FeaturedProductsProps {
  products: Product[];
  tenantSlug: string;
}

// A dedicated section for isFeatured products - Sprint 8 redesign item 7.
// Native horizontal scroll + CSS scroll-snap for the "swipe" feel the spec
// asks for, not a JS carousel library (keeps this section's client JS at
// zero beyond the shared page bundle - Sprint 8's own performance rule).
export function FeaturedProducts({ products, tenantSlug }: FeaturedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 pb-2 pt-5">
      <h2 className="px-3 font-[family-name:var(--sf-font-heading)] text-lg font-semibold" style={{ color: "var(--sf-text)" }}>
        Öne Çıkanlar
      </h2>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1" style={{ scrollbarWidth: "none" }}>
        {products.map((product) => {
          const price = startingPrice(product) ?? formatPrice(product.price);
          return (
            <Link
              key={product.id}
              href={`/${tenantSlug}/product/${product.slug}`}
              className="flex w-[68vw] shrink-0 snap-start flex-col overflow-hidden transition-transform duration-fast active:scale-[0.98] sm:w-56"
              style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border)", borderRadius: "var(--sf-radius)" }}
            >
              <div className="relative aspect-[4/3] w-full">
                {product.imageId ? (
                  <Image src={mediaFileUrl(product.imageId)} alt={product.name} fill sizes="272px" className="object-cover" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-2xl font-semibold"
                    style={{ background: "linear-gradient(150deg, var(--sf-background), var(--sf-border))", color: "var(--sf-muted-text)" }}
                  >
                    {productInitial(product.name)}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-3">
                <ProductBadges isFeatured tags={product.tags.slice(0, 1)} size="sm" />
                <span className="line-clamp-1 font-[family-name:var(--sf-font-heading)] text-sm font-semibold" style={{ color: "var(--sf-text)" }}>
                  {product.name}
                </span>
                <span className="font-[family-name:var(--sf-font-heading)] text-sm font-bold" style={{ color: "var(--sf-primary)" }}>
                  {price}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

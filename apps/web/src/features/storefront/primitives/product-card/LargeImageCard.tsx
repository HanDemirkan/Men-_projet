import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { formatPrice, productInitial, startingPrice } from "./types";
import type { StorefrontProductCardProps } from "./types";

import { mediaFileUrl } from "@/services/media.service";

// Spec §9 "Large Image" - big photo on top, text below - one card per row,
// photography-forward. Not one of the 3 curated templates' default
// (Sprint 8), but stays selectable via the Layout step.
export function LargeImageCard({ product, layout, href }: StorefrontProductCardProps) {
  const price = startingPrice(product) ?? formatPrice(product.price);
  const aspectClass = layout.photoAspectRatio === "16:9" ? "aspect-video" : layout.photoAspectRatio === "3:4" ? "aspect-[3/4]" : "aspect-[4/3]";

  return (
    <Link
      href={href}
      className="flex flex-col overflow-hidden transition-transform duration-fast ease-standard active:scale-[0.98]"
      style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border)", borderRadius: "var(--sf-radius)" }}
    >
      <div className={`relative w-full ${aspectClass}`}>
        {product.imageId ? (
          <Image src={mediaFileUrl(product.imageId)} alt={product.name} fill sizes="(max-width: 512px) 100vw, 512px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold" style={{ backgroundColor: "var(--sf-background)", color: "var(--sf-muted-text)" }}>
            {productInitial(product.name)}
          </div>
        )}
        {!product.isAvailable ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">Stokta Yok</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-1.5 font-[family-name:var(--sf-font-heading)] text-base font-semibold" style={{ color: "var(--sf-text)" }}>
            {product.name}
            {product.isFeatured ? <Star className="h-3.5 w-3.5 shrink-0 fill-current" style={{ color: "var(--sf-accent)" }} aria-label="Öne çıkan ürün" /> : null}
          </span>
          <span className="shrink-0 font-[family-name:var(--sf-font-heading)] text-base font-semibold" style={{ color: "var(--sf-primary)" }}>
            {price}
          </span>
        </div>
        {product.shortDescription ? (
          <p className="text-sm" style={{ color: "var(--sf-muted-text)" }}>
            {product.shortDescription}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

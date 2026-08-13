import Image from "next/image";
import Link from "next/link";

import { ProductBadges } from "./ProductBadges";
import { formatPrice, photoAspectClassNameFor, productInitial, startingPrice } from "./types";
import type { StorefrontProductCardProps } from "./types";

import { mediaFileUrl } from "@/services/media.service";

// "Visual" card system (Modern Cafe's default) - Sprint 8 redesign: large
// photography leads, name/price read at a glance, description and badges
// are clearly secondary. The old version was a thumbnail with two lines of
// text under it; this is a real photo-led menu card.
export function GridCard({ product, layout, href }: StorefrontProductCardProps) {
  const price = startingPrice(product) ?? formatPrice(product.price);

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden transition-transform duration-fast ease-standard active:scale-[0.98]"
      style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border)", borderRadius: "var(--sf-radius)" }}
    >
      <div className={`relative w-full ${photoAspectClassNameFor(layout.photoAspectRatio)}`}>
        {product.imageId ? (
          <Image
            src={mediaFileUrl(product.imageId)}
            alt={product.name}
            fill
            sizes="(max-width: 512px) 50vw, 256px"
            className="object-cover transition-transform duration-normal ease-standard group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-3xl font-semibold"
            style={{ background: "linear-gradient(150deg, var(--sf-background), var(--sf-border))", color: "var(--sf-muted-text)" }}
          >
            {productInitial(product.name)}
          </div>
        )}
        {!product.isAvailable ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-900">Stokta yok</span>
          </div>
        ) : null}
        {product.isFeatured ? (
          <span
            className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm"
            style={{ backgroundColor: "var(--sf-accent)", color: "var(--sf-accent-foreground)" }}
          >
            Popüler
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="line-clamp-1 font-[family-name:var(--sf-font-heading)] text-[15px] font-semibold" style={{ color: "var(--sf-text)" }}>
          {product.name}
        </span>
        {product.shortDescription ? (
          <p className="line-clamp-1 font-[family-name:var(--sf-font-body)] text-xs" style={{ color: "var(--sf-muted-text)" }}>
            {product.shortDescription}
          </p>
        ) : null}
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="font-[family-name:var(--sf-font-heading)] text-[15px] font-bold" style={{ color: "var(--sf-primary)" }}>
            {price}
          </span>
          {product.tags.length > 0 ? <ProductBadges isFeatured={false} tags={product.tags.slice(0, 2)} size="sm" /> : null}
        </div>
      </div>
    </Link>
  );
}

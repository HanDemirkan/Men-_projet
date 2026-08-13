"use client";

import type { StorefrontConfig } from "@qr-platform/shared";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@qr-platform/ui";
import { ChevronLeft, Clock, Flame, TriangleAlert, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { ProductBadges } from "../primitives/product-card/ProductBadges";
import { productInitial, startingPrice } from "../primitives/product-card/types";
import { backgroundTextureStyle, layoutToCssVars, themeToCssVars } from "../theme-to-css";

import { mediaFileUrl } from "@/services/media.service";
import type { StorefrontProductPage } from "@/types/storefront";

export interface ProductDetailSheetProps {
  data: StorefrontProductPage;
}

// Spec §10: mobile product detail as a bottom sheet / full-screen sheet, no
// "Sepete ekle" (there's no ordering feature yet - showing one would set a
// false expectation) - purely an "incele" (inspect) experience. Backed by
// packages/ui's Drawer (Radix Dialog under the hood - focus trap, ESC,
// aria-modal all come for free) rather than a bespoke overlay. Rendered as
// the entire content of the /product/[productSlug] route, open by default;
// closing it navigates back, so the URL stays real and shareable even
// though the presentation is sheet-style.
//
// Sprint 8 redesign: the old version was a flat aspect-ratio image + plain
// text list - functionally complete but nowhere near the reference's own
// product page (floating chrome over the photo, a real price badge, a
// dedicated nutrition read-out). This keeps every real data field the old
// version had and none it didn't invent.
export function ProductDetailSheet({ data }: ProductDetailSheetProps) {
  const router = useRouter();
  const { product, storefrontConfig, tenant } = data;
  const { theme, layout } = storefrontConfig as StorefrontConfig;
  const price = startingPrice(product) ?? `${product.price} ₺`;

  return (
    <Drawer open onOpenChange={(open) => !open && router.back()}>
      <DrawerContent
        side="bottom"
        className="mx-auto max-h-[92vh] w-full max-w-lg gap-0 overflow-y-auto p-0"
        style={{ ...themeToCssVars(theme), ...layoutToCssVars(layout), ...backgroundTextureStyle(theme, layout), backgroundColor: "var(--sf-background)" }}
      >
        <DrawerDescription className="sr-only">{product.shortDescription ?? product.name} ürün detayı</DrawerDescription>

        <div className="relative aspect-[4/3] w-full">
          {product.imageId ? (
            <Image src={mediaFileUrl(product.imageId)} alt={product.name} fill sizes="512px" className="object-cover" priority />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-4xl font-semibold"
              style={{ background: "linear-gradient(150deg, var(--sf-background), var(--sf-border))", color: "var(--sf-muted-text)" }}
            >
              {productInitial(product.name)}
            </div>
          )}
          {/* Floating chrome over the photo, frosted-glass on any image -
              mirrors the reference's own back/close treatment. */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
            <a
              href={`/${tenant.slug}/category/${product.category.slug}`}
              aria-label={`${product.category.name} kategorisine dön`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md transition-transform duration-fast active:scale-90"
            >
              <ChevronLeft className="h-5 w-5" />
            </a>
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Kapat"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md transition-transform duration-fast active:scale-90"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <p className="font-[family-name:var(--sf-font-body)] text-xs" style={{ color: "var(--sf-muted-text)" }}>
            {product.category.name}
          </p>

          <div className="flex items-start justify-between gap-3">
            <DrawerTitle className="font-[family-name:var(--sf-font-heading)] text-xl font-bold" style={{ color: "var(--sf-text)" }}>
              {product.name}
            </DrawerTitle>
            <span
              className="shrink-0 rounded-full px-3 py-1 font-[family-name:var(--sf-font-heading)] text-base font-bold"
              style={{ backgroundColor: "var(--sf-primary)", color: "var(--sf-primary-foreground)" }}
            >
              {price}
            </span>
          </div>

          <ProductBadges isFeatured={product.isFeatured} tags={product.tags} size="md" />

          {!product.isAvailable ? (
            <p className="text-sm font-medium" style={{ color: "var(--sf-accent)" }}>
              Şu anda stokta yok
            </p>
          ) : null}

          {product.description ? (
            <p className="font-[family-name:var(--sf-font-body)] text-sm leading-relaxed" style={{ color: "var(--sf-text)" }}>
              {product.description}
            </p>
          ) : null}

          {(product.preparationTime ?? product.calories) ? (
            <div className="flex gap-4 border-t pt-4 text-sm" style={{ borderColor: "var(--sf-border)", color: "var(--sf-muted-text)" }}>
              {product.calories ? (
                <span className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4" aria-hidden="true" />
                  <span className="font-semibold" style={{ color: "var(--sf-text)" }}>
                    {product.calories}
                  </span>{" "}
                  kalori
                </span>
              ) : null}
              {product.preparationTime ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span className="font-semibold" style={{ color: "var(--sf-text)" }}>
                    {product.preparationTime}
                  </span>{" "}
                  dakika
                </span>
              ) : null}
            </div>
          ) : null}

          {product.allergens ? (
            <p className="flex items-start gap-1.5 text-sm" style={{ color: "var(--sf-muted-text)" }}>
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="font-medium" style={{ color: "var(--sf-text)" }}>
                  Alerjenler:
                </span>{" "}
                {product.allergens}
              </span>
            </p>
          ) : null}

          {product.variants && product.variants.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="font-[family-name:var(--sf-font-heading)] text-sm font-semibold" style={{ color: "var(--sf-text)" }}>
                Seçenekler
              </p>
              {product.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex justify-between p-3 text-sm"
                  style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border)", borderRadius: "var(--sf-radius)", color: "var(--sf-text)" }}
                >
                  <span>{variant.name}</span>
                  <span className="font-medium">{variant.price} ₺</span>
                </div>
              ))}
            </div>
          ) : null}

          {product.optionGroups && product.optionGroups.length > 0
            ? product.optionGroups.map((group) => (
                <div key={group.id} className="flex flex-col gap-2">
                  <p className="font-[family-name:var(--sf-font-heading)] text-sm font-semibold" style={{ color: "var(--sf-text)" }}>
                    {group.name}
                  </p>
                  {group.options?.map((option) => (
                    <div key={option.id} className="flex justify-between text-sm" style={{ color: "var(--sf-muted-text)" }}>
                      <span>{option.name}</span>
                      {Number(option.price) > 0 ? <span>+{option.price} ₺</span> : null}
                    </div>
                  ))}
                </div>
              ))
            : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

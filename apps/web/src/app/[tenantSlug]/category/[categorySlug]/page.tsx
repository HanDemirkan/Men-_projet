import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { PRODUCT_CARD_REGISTRY, productCardGridClassName } from "@/features/storefront/primitives/product-card";
import { backgroundTextureStyle, headingSizeClassName, layoutToCssVars, themeToCssVars } from "@/features/storefront/theme-to-css";
import { publicFetch, withSearch } from "@/lib/public-fetch";
import type { StorefrontCategoryPage } from "@/types/storefront";

interface StorefrontCategoryRouteProps {
  params: { tenantSlug: string; categorySlug: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export async function generateMetadata({ params }: StorefrontCategoryRouteProps): Promise<Metadata> {
  const result = await publicFetch<StorefrontCategoryPage>(
    `/storefront/${params.tenantSlug}/category/${params.categorySlug}`,
  );

  if (result.status !== "success") {
    return {};
  }

  return { title: result.data.category.name, description: result.data.category.description ?? undefined };
}

export default async function StorefrontCategoryRoute({ params, searchParams }: StorefrontCategoryRouteProps) {
  const result = await publicFetch<StorefrontCategoryPage>(
    `/storefront/${params.tenantSlug}/category/${params.categorySlug}`,
  );

  if (result.status === "redirect") {
    permanentRedirect(withSearch(`/${result.targetSlug}/category/${params.categorySlug}`, searchParams));
  }

  if (result.status !== "success") {
    notFound();
  }

  const { category, storefrontConfig } = result.data;
  const { theme, layout } = storefrontConfig;
  const ProductCardComponent = PRODUCT_CARD_REGISTRY[layout.productCard].Component;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      style={{ ...themeToCssVars(theme), ...layoutToCssVars(layout), ...backgroundTextureStyle(theme, layout) }}
      className="min-h-dvh w-full font-[family-name:var(--sf-font-body)]"
    >
      <div className="mx-auto flex w-full flex-col gap-4 p-5 sm:max-w-lg" style={{ backgroundColor: "var(--sf-background)" }}>
        <Link href={`/${params.tenantSlug}/menu`} className="text-sm font-medium" style={{ color: "var(--sf-muted-text)" }}>
          ← Menüye dön
        </Link>
        <h1 className={`font-[family-name:var(--sf-font-heading)] font-bold ${headingSizeClassName(theme)}`} style={{ color: "var(--sf-text)" }}>
          {category.name}
        </h1>
        {category.description ? (
          <p className="text-sm" style={{ color: "var(--sf-muted-text)" }}>
            {category.description}
          </p>
        ) : null}

        <div className={productCardGridClassName(layout.productCard)}>
          {category.products.map((product) => (
            <ProductCardComponent
              key={product.id}
              product={product}
              theme={theme}
              layout={layout}
              href={`/${params.tenantSlug}/product/${product.slug}`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

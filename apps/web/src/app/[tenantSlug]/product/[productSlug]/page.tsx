import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { ProductDetailSheet } from "@/features/storefront/components/ProductDetailSheet";
import { publicFetch, withSearch } from "@/lib/public-fetch";
import { mediaFileUrl } from "@/services/media.service";
import type { StorefrontProductPage } from "@/types/storefront";

interface StorefrontProductRouteProps {
  params: { tenantSlug: string; productSlug: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export async function generateMetadata({ params }: StorefrontProductRouteProps): Promise<Metadata> {
  const result = await publicFetch<StorefrontProductPage>(
    `/storefront/${params.tenantSlug}/product/${params.productSlug}`,
  );

  if (result.status !== "success") {
    return {};
  }

  const { product } = result.data;
  return {
    title: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    openGraph: product.imageId ? { images: [{ url: mediaFileUrl(product.imageId) }] } : undefined,
    other: {
      "product:price:amount": product.price,
    },
  };
}

export default async function StorefrontProductRoute({ params, searchParams }: StorefrontProductRouteProps) {
  const result = await publicFetch<StorefrontProductPage>(
    `/storefront/${params.tenantSlug}/product/${params.productSlug}`,
  );

  if (result.status === "redirect") {
    permanentRedirect(withSearch(`/${result.targetSlug}/product/${params.productSlug}`, searchParams));
  }

  if (result.status !== "success") {
    notFound();
  }

  const { product, tenant } = result.data;

  // schema.org/Product JSON-LD for the product detail page - spec §12.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    image: product.imageId ? mediaFileUrl(product.imageId) : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: tenant.currency,
      availability: product.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetailSheet data={result.data} />
    </>
  );
}

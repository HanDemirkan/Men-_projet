import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { publicFetch } from "@/lib/public-fetch";
import { mediaFileUrl } from "@/services/media.service";
import type { StorefrontHome } from "@/types/storefront";

interface TenantSlugLayoutProps {
  children: ReactNode;
  params: { tenantSlug: string };
}

// Returns the first argument that's neither null/undefined NOR an empty
// (whitespace-only) string - plain `??` treats "" as "set", which let a
// blank meta description through in practice (see generateMetadata below).
function firstNonEmpty(...values: Array<string | null | undefined>): string | undefined {
  return values.find((v): v is string => v !== null && v !== undefined && v.trim().length > 0);
}

export async function generateMetadata({ params }: { params: { tenantSlug: string } }): Promise<Metadata> {
  const result = await publicFetch<StorefrontHome>(`/storefront/${params.tenantSlug}`);

  if (result.status !== "success") {
    return {};
  }

  const { tenant, storefrontConfig } = result.data;
  // Always emit a non-empty meta description - a customized SEO description
  // wins, then the tenant's own About text, then a plain fallback so a
  // freshly-created storefront is never shipped with zero SEO description
  // (a real Lighthouse SEO audit point, not a cosmetic default). `??` alone
  // isn't enough here - a business profile save can legitimately persist an
  // empty string (not null) for an untouched optional field, which `??`
  // treats as "set" and would otherwise ship a blank meta description.
  const description = firstNonEmpty(storefrontConfig.seo.description, tenant.about) ?? `${tenant.name} - Dijital Menü`;
  const title = firstNonEmpty(storefrontConfig.seo.title) ?? tenant.name;
  const ogImageId = storefrontConfig.ogImageMediaId ?? tenant.coverImageId ?? tenant.logoImageId;

  return {
    title: { default: title, template: `%s | ${tenant.name}` },
    description,
    icons: storefrontConfig.faviconMediaId ? [{ url: mediaFileUrl(storefrontConfig.faviconMediaId) }] : undefined,
    openGraph: {
      title: tenant.name,
      description,
      images: ogImageId ? [{ url: mediaFileUrl(ogImageId) }] : undefined,
      type: "website",
    },
  };
}

// No shared visual chrome here (deliberately) - each leaf page applies its
// own theme wrapper from the storefrontConfig it already needs to fetch for
// its own content, avoiding a second, layout-level fetch just for styling.
//
// Deliberately does NOT wrap children in PageTransition (unlike the admin/
// business panels and auth pages): a real Lighthouse audit against a
// production build found this route's first paint gated entirely behind
// PageTransition's page-wide opacity:0->1 animation - since nothing else on
// the page renders visibly until that one animation resolves, it produced a
// genuine NO_FCP (never-painted) result under Lighthouse's CPU/network
// throttling, not just a cosmetic slowdown. Spec §11 explicitly forbids
// animations delaying first load, and a QR-scanning customer's first view of
// the menu is exactly the moment speed matters most - so this route trades
// the page-enter fade for guaranteed-immediate content instead.
export default function TenantSlugLayout({ children, params }: TenantSlugLayoutProps): ReactNode {
  if (!params.tenantSlug) {
    notFound();
  }

  return children;
}

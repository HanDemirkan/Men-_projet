import { notFound, permanentRedirect } from "next/navigation";

import { StorefrontRenderer } from "@/features/storefront/components/StorefrontRenderer";
import { publicFetch, withSearch } from "@/lib/public-fetch";
import type { StorefrontMenuPage } from "@/types/storefront";

interface StorefrontHomePageProps {
  params: { tenantSlug: string };
  searchParams: Record<string, string | string[] | undefined>;
}

// The QR destination is the tenant root URL and must open the actual menu
// immediately. Previously this route rendered a lightweight "home" shell
// with only menu names, forcing a second tap before products appeared. That
// made a QR scan feel unfinished and made the real storefront differ from
// the approved Design Review. The root now uses the same full menu payload
// and renderer as /menu while keeping the permanent, short QR URL stable.
export default async function StorefrontHomePage({ params, searchParams }: StorefrontHomePageProps) {
  const result = await publicFetch<StorefrontMenuPage>(`/storefront/${params.tenantSlug}/menu`);

  if (result.status === "redirect") {
    permanentRedirect(withSearch(`/${result.targetSlug}`, searchParams));
  }

  if (result.status !== "success") {
    notFound();
  }

  const { tenant, storefrontConfig, menus } = result.data;

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-dvh w-full flex-col sm:max-w-lg">
      <StorefrontRenderer tenant={tenant} config={storefrontConfig} mode="menu" menus={menus} />
    </main>
  );
}

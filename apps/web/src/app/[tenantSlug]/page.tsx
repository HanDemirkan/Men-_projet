import { notFound, permanentRedirect } from "next/navigation";

import { StorefrontRenderer } from "@/features/storefront/components/StorefrontRenderer";
import { publicFetch, withSearch } from "@/lib/public-fetch";
import type { StorefrontHome } from "@/types/storefront";

interface StorefrontHomePageProps {
  params: { tenantSlug: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function StorefrontHomePage({ params, searchParams }: StorefrontHomePageProps) {
  const result = await publicFetch<StorefrontHome>(`/storefront/${params.tenantSlug}`);

  if (result.status === "redirect") {
    permanentRedirect(withSearch(`/${result.targetSlug}`, searchParams));
  }

  if (result.status !== "success") {
    notFound();
  }

  const { tenant, storefrontConfig, menus } = result.data;

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-dvh w-full flex-col sm:max-w-lg">
      <StorefrontRenderer
        tenant={tenant}
        config={storefrontConfig}
        mode="home"
        menus={menus}
        menuSummaryHref={`/${params.tenantSlug}/menu`}
      />
    </main>
  );
}

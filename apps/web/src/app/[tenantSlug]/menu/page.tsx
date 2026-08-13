import { notFound, permanentRedirect } from "next/navigation";

import { StorefrontRenderer } from "@/features/storefront/components/StorefrontRenderer";
import { publicFetch, withSearch } from "@/lib/public-fetch";
import type { StorefrontMenuPage } from "@/types/storefront";

interface StorefrontMenuRouteProps {
  params: { tenantSlug: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function StorefrontMenuRoute({ params, searchParams }: StorefrontMenuRouteProps) {
  const result = await publicFetch<StorefrontMenuPage>(`/storefront/${params.tenantSlug}/menu`);

  if (result.status === "redirect") {
    permanentRedirect(withSearch(`/${result.targetSlug}/menu`, searchParams));
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

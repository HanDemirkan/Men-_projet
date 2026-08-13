import { EmptyState, PageHeader } from "@qr-platform/ui";
import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

import { StorefrontBuilder } from "@/features/storefront/components/StorefrontBuilder";
import { publicFetch } from "@/lib/public-fetch";
import { serverFetch } from "@/lib/server-fetch";
import type { StorefrontConfigState } from "@/services/storefront-config.service";
import type { BusinessProfile } from "@/types/catalog";
import type { StorefrontMenu, StorefrontMenuPage } from "@/types/storefront";

export const metadata: Metadata = {
  title: "QR & Storefront — QR Platform",
};

export default async function BusinessStorefrontPage() {
  const [tenant, config] = await Promise.all([
    serverFetch<BusinessProfile>("/business/profile"),
    serverFetch<StorefrontConfigState>("/storefront-config"),
  ]);

  let previewMenus: StorefrontMenu[] = [];
  if (tenant?.slug) {
    const publicMenu = await publicFetch<StorefrontMenuPage>(`/storefront/${tenant.slug}/menu`);
    if (publicMenu.status === "success") {
      previewMenus = publicMenu.data.menus;
    }
  }

  return (
    <>
      <PageHeader
        title="QR & Storefront"
        subtitle="Müşterinizin QR kodu okuttuğunda göreceği gerçek menüyü tasarlayın ve yayınlayın."
      />
      {tenant && config ? (
        <StorefrontBuilder
          tenant={tenant}
          menus={previewMenus}
          initialTemplateCode={config.templateCode}
          initialDraft={config.draft}
          initialHasUnpublishedChanges={config.hasUnpublishedChanges}
          initialPublishedAt={config.publishedAt}
        />
      ) : (
        <EmptyState icon={AlertTriangle} title="Storefront ayarları yüklenemedi" description="Sayfayı yenilemeyi deneyin." />
      )}
    </>
  );
}

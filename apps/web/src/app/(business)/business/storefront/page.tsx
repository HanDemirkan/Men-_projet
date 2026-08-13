import { EmptyState, PageHeader } from "@qr-platform/ui";
import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

import { StorefrontBuilder } from "@/features/storefront/components/StorefrontBuilder";
import { serverFetch } from "@/lib/server-fetch";
import type { StorefrontConfigState } from "@/services/storefront-config.service";
import type { Menu } from "@/types/catalog";
import type { BusinessProfile } from "@/types/catalog";

export const metadata: Metadata = {
  title: "QR & Storefront — QR Platform",
};

export default async function BusinessStorefrontPage() {
  const [tenant, config, menus] = await Promise.all([
    serverFetch<BusinessProfile>("/business/profile"),
    serverFetch<StorefrontConfigState>("/storefront-config"),
    serverFetch<Menu[]>("/menus"),
  ]);

  return (
    <>
      <PageHeader
        title="QR & Storefront"
        subtitle="Public sayfanızın tasarımını, QR kodunu ve SEO ayarlarını yönetin."
      />
      {tenant && config ? (
        <StorefrontBuilder
          tenant={tenant}
          menus={(menus ?? []).map((menu) => ({ id: menu.id, name: menu.name }))}
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

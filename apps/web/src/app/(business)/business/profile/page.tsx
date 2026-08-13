import { EmptyState, PageHeader } from "@qr-platform/ui";
import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

import { BusinessProfileForm } from "@/features/business-profile/components/BusinessProfileForm";
import { serverFetch } from "@/lib/server-fetch";
import type { BusinessProfile } from "@/types/catalog";

export const metadata: Metadata = {
  title: "İşletme Profili — QR Platform",
};

export default async function BusinessProfilePage() {
  const profile = await serverFetch<BusinessProfile>("/business/profile");

  return (
    <>
      <PageHeader
        title="İşletme Profili"
        subtitle="Dijital vitrininizde görünecek işletme bilgilerini yönetin."
      />
      {profile ? (
        <BusinessProfileForm profile={profile} />
      ) : (
        <EmptyState
          icon={AlertTriangle}
          title="İşletme profili yüklenemedi"
          description="Sayfayı yenilemeyi deneyin."
        />
      )}
    </>
  );
}

import { ROLES } from "@qr-platform/permissions";
import { EmptyState, PageHeader, StatCard } from "@qr-platform/ui";
import { UtensilsCrossed } from "lucide-react";
import type { Metadata } from "next";

import { getMockStats } from "@/fixtures/stats.fixture";

export const metadata: Metadata = {
  title: "İşletme Paneli — QR Platform",
};

export default function BusinessPage() {
  const stats = getMockStats(ROLES.TENANT_OWNER);

  return (
    <>
      <PageHeader title="Genel Bakış" subtitle="İşletmenizin günlük operasyon özeti." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} trend={stat.trend} />
        ))}
      </div>

      <EmptyState
        icon={UtensilsCrossed}
        title="Menünüz henüz oluşturulmadı"
        description="Bu Sprint 1 kapsamında yalnızca panel arayüzü hazırlanmıştır; menü yönetimi sonraki sprintte eklenecektir."
      />
    </>
  );
}

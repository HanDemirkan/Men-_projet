import { ROLES } from "@qr-platform/permissions";
import { EmptyState, PageHeader, StatCard } from "@qr-platform/ui";
import { Building2 } from "lucide-react";
import type { Metadata } from "next";

import { getMockStats } from "@/fixtures/stats.fixture";

export const metadata: Metadata = {
  title: "Süper Admin Paneli — QR Platform",
};

export default function AdminPage() {
  const stats = getMockStats(ROLES.SUPER_ADMIN);

  return (
    <>
      <PageHeader title="Genel Bakış" subtitle="Platformdaki tüm işletmelerin özeti." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} trend={stat.trend} />
        ))}
      </div>

      <EmptyState
        icon={Building2}
        title="İşletme listesi henüz bağlı değil"
        description="Bu Sprint 1 kapsamında yalnızca panel arayüzü hazırlanmıştır; gerçek işletme verileri sonraki sprintte eklenecektir."
      />
    </>
  );
}

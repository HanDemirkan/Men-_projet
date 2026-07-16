import { ROLES } from "@qr-platform/permissions";
import { EmptyState, PageHeader, StatCard } from "@qr-platform/ui";
import { Table2 } from "lucide-react";
import type { Metadata } from "next";

import { getMockStats } from "@/fixtures/stats.fixture";

export const metadata: Metadata = {
  title: "Garson Paneli — QR Platform",
};

export default function WaiterPage() {
  const stats = getMockStats(ROLES.WAITER);

  return (
    <>
      <PageHeader title="Genel Bakış" subtitle="Size atanan masaların ve siparişlerin özeti." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} trend={stat.trend} />
        ))}
      </div>

      <EmptyState
        icon={Table2}
        title="Henüz atanmış masa yok"
        description="Bu Sprint 1 kapsamında yalnızca panel arayüzü hazırlanmıştır; masa/sipariş yönetimi sonraki sprintte eklenecektir."
      />
    </>
  );
}

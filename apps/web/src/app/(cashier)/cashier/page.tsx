import { ROLES } from "@qr-platform/permissions";
import { EmptyState, PageHeader, StatCard } from "@qr-platform/ui";
import { Wallet } from "lucide-react";
import type { Metadata } from "next";

import { getMockStats } from "@/fixtures/stats.fixture";

export const metadata: Metadata = {
  title: "Kasa Paneli — QR Platform",
};

export default function CashierPage() {
  const stats = getMockStats(ROLES.CASHIER);

  return (
    <>
      <PageHeader title="Genel Bakış" subtitle="Vardiyanızın kasa özeti." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} trend={stat.trend} />
        ))}
      </div>

      <EmptyState
        icon={Wallet}
        title="Açık adisyon yok"
        description="Bu Sprint 1 kapsamında yalnızca panel arayüzü hazırlanmıştır; kasa işlemleri sonraki sprintte eklenecektir."
      />
    </>
  );
}

import { ROLES } from "@qr-platform/permissions";
import { EmptyState, PageHeader, StatCard } from "@qr-platform/ui";
import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";

import { getMockStats } from "@/fixtures/stats.fixture";

export const metadata: Metadata = {
  title: "Mutfak Paneli — QR Platform",
};

export default function KitchenPage() {
  const stats = getMockStats(ROLES.KITCHEN);

  return (
    <>
      <PageHeader title="Genel Bakış" subtitle="Mutfak sipariş kuyruğunun özeti." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} trend={stat.trend} />
        ))}
      </div>

      <EmptyState
        icon={ClipboardList}
        title="Bekleyen sipariş yok"
        description="Bu Sprint 1 kapsamında yalnızca panel arayüzü hazırlanmıştır; sipariş kuyruğu sonraki sprintte eklenecektir."
      />
    </>
  );
}

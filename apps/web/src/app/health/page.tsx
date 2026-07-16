import { PageHeader } from "@qr-platform/ui";

import { HealthStatusPanel } from "@/features/health/HealthStatusPanel";

export default function HealthPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <PageHeader
        title="Sistem Durumu"
        subtitle="API, PostgreSQL ve Redis bağlantı durumlarını gösterir."
      />
      <HealthStatusPanel />
    </main>
  );
}

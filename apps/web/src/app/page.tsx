import { PageHeader } from "@/components/PageHeader";
import { HealthStatusPanel } from "@/features/health/HealthStatusPanel";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <PageHeader title="QR Platform" subtitle="Web uygulaması çalışıyor." />
      <HealthStatusPanel />
    </main>
  );
}

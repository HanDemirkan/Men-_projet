import { EmptyState, PageHeader } from "@qr-platform/ui";
import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

import { SystemStatusView } from "@/features/admin/system/components/SystemStatusView";
import { serverFetch } from "@/lib/server-fetch";
import type { AdminSystemInfo } from "@/types/admin";

export const metadata: Metadata = {
  title: "Sistem Durumu — Süper Admin — QR Platform",
};

export default async function AdminSystemPage() {
  const info = await serverFetch<AdminSystemInfo>("/admin/system");

  return (
    <>
      <PageHeader title="Sistem Durumu" subtitle="API, veritabanı, Redis ve worker sağlık durumu." />
      {info ? (
        <SystemStatusView info={info} />
      ) : (
        <EmptyState icon={AlertTriangle} title="Sistem durumu alınamadı" description="Şu anda sistem bilgisi görüntülenemiyor." />
      )}
    </>
  );
}

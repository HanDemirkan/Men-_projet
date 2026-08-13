import { PageHeader } from "@qr-platform/ui";
import type { Metadata } from "next";

import { CreateTenantForm } from "@/features/admin/tenants/components/CreateTenantForm";

export const metadata: Metadata = {
  title: "Yeni İşletme — Süper Admin — QR Platform",
};

export default function AdminNewTenantPage() {
  return (
    <>
      <PageHeader title="Yeni İşletme" subtitle="İşletme, ilk şube ve sahip hesabını tek seferde oluşturun." />
      <CreateTenantForm />
    </>
  );
}

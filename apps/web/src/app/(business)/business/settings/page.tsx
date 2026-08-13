import { PERMISSIONS, ROLES } from "@qr-platform/permissions";
import { EmptyState, PageHeader } from "@qr-platform/ui";
import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

import { BusinessSettingsForm } from "@/features/business/settings/components/BusinessSettingsForm";
import { PermissionDenied } from "@/features/business/shared/components/PermissionDenied";
import { requireUser } from "@/lib/auth/require-user";
import { serverFetch } from "@/lib/server-fetch";
import type { BusinessSettings } from "@/types/business";

export const metadata: Metadata = {
  title: "Ayarlar — İşletme Paneli — QR Platform",
};

export default async function BusinessSettingsPage() {
  const user = await requireUser([ROLES.TENANT_OWNER, ROLES.BRANCH_MANAGER, ROLES.MENU_EDITOR]);

  if (!user.permissions.includes(PERMISSIONS.BUSINESS_SETTINGS_READ)) {
    return <PermissionDenied />;
  }

  const settings = await serverFetch<BusinessSettings>("/business/settings");

  if (!settings) {
    return (
      <>
        <PageHeader title="Ayarlar" subtitle="İşletme genel ayarlarınızı yönetin." />
        <EmptyState icon={AlertTriangle} title="Ayarlar alınamadı" description="Şu anda ayarlar görüntülenemiyor." />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Ayarlar" subtitle="İşletme genel ayarlarınızı yönetin." />
      <BusinessSettingsForm settings={settings} canUpdate={user.permissions.includes(PERMISSIONS.BUSINESS_SETTINGS_UPDATE)} />
    </>
  );
}

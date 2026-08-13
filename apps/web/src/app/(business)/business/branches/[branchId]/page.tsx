import { PERMISSIONS, ROLES } from "@qr-platform/permissions";
import { EmptyState, PageHeader } from "@qr-platform/ui";
import { Store } from "lucide-react";
import type { Metadata } from "next";

import { BranchDetailView } from "@/features/business/branches/components/BranchDetailView";
import { PermissionDenied } from "@/features/business/shared/components/PermissionDenied";
import { requireUser } from "@/lib/auth/require-user";
import { serverFetch } from "@/lib/server-fetch";
import type { BusinessBranch } from "@/types/business";

export const metadata: Metadata = {
  title: "Şube Detayı — İşletme Paneli — QR Platform",
};

export interface BusinessBranchDetailPageProps {
  params: { branchId: string };
}

export default async function BusinessBranchDetailPage({ params }: BusinessBranchDetailPageProps) {
  const user = await requireUser([ROLES.TENANT_OWNER, ROLES.BRANCH_MANAGER, ROLES.MENU_EDITOR]);

  if (!user.permissions.includes(PERMISSIONS.BRANCH_READ)) {
    return <PermissionDenied />;
  }

  const branch = await serverFetch<BusinessBranch>(`/business/branches/${params.branchId}`);

  if (!branch) {
    return (
      <EmptyState
        icon={Store}
        title="Şube bulunamadı"
        description="Bu şube mevcut değil ya da erişiminiz yok."
      />
    );
  }

  return (
    <>
      <PageHeader title={branch.name} subtitle="Şube bilgilerini görüntüleyin ve düzenleyin." />
      <BranchDetailView branch={branch} canManageStatus={user.permissions.includes(PERMISSIONS.BRANCH_UPDATE)} />
    </>
  );
}

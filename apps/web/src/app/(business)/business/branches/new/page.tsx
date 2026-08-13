import { PERMISSIONS, ROLES } from "@qr-platform/permissions";
import { PageHeader } from "@qr-platform/ui";
import type { Metadata } from "next";

import { CreateBranchForm } from "@/features/business/branches/components/CreateBranchForm";
import { PermissionDenied } from "@/features/business/shared/components/PermissionDenied";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "Yeni Şube — İşletme Paneli — QR Platform",
};

export default async function NewBusinessBranchPage() {
  const user = await requireUser([ROLES.TENANT_OWNER, ROLES.BRANCH_MANAGER, ROLES.MENU_EDITOR]);

  if (!user.permissions.includes(PERMISSIONS.BRANCH_CREATE)) {
    return <PermissionDenied description="Yeni şube oluşturma yetkisi yalnızca işletme sahibine aittir." />;
  }

  return (
    <>
      <PageHeader title="Yeni Şube" subtitle="İşletmenize yeni bir şube ekleyin." />
      <CreateBranchForm />
    </>
  );
}

import { PERMISSIONS, ROLES } from "@qr-platform/permissions";
import { PageHeader } from "@qr-platform/ui";
import type { Metadata } from "next";

import { PermissionDenied } from "@/features/business/shared/components/PermissionDenied";
import { CreateUserForm } from "@/features/business/users/components/CreateUserForm";
import { requireUser } from "@/lib/auth/require-user";
import { serverFetch } from "@/lib/server-fetch";
import type { BusinessBranch, PaginatedResult } from "@/types/business";

export const metadata: Metadata = {
  title: "Yeni Personel — İşletme Paneli — QR Platform",
};

export default async function NewBusinessUserPage() {
  const user = await requireUser([ROLES.TENANT_OWNER, ROLES.BRANCH_MANAGER, ROLES.MENU_EDITOR]);

  if (!user.permissions.includes(PERMISSIONS.USER_CREATE)) {
    return <PermissionDenied description="Yeni personel oluşturma yetkiniz yok." />;
  }

  const branchesPage = await serverFetch<PaginatedResult<BusinessBranch>>(
    "/business/branches?pageSize=100&sortBy=name&sortDir=asc",
  );

  return (
    <>
      <PageHeader title="Yeni Personel" subtitle="İşletmenize yeni bir personel ekleyin." />
      <CreateUserForm branches={branchesPage?.items ?? []} callerRole={user.role} callerBranchId={user.branchId} />
    </>
  );
}

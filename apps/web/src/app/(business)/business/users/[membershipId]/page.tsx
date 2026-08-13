import { PERMISSIONS, ROLES } from "@qr-platform/permissions";
import { EmptyState, PageHeader } from "@qr-platform/ui";
import { UserX } from "lucide-react";
import type { Metadata } from "next";

import { PermissionDenied } from "@/features/business/shared/components/PermissionDenied";
import { BusinessUserDetailView } from "@/features/business/users/components/BusinessUserDetailView";
import { requireUser } from "@/lib/auth/require-user";
import { serverFetch } from "@/lib/server-fetch";
import type { BusinessBranch, BusinessMembershipDetail, PaginatedResult } from "@/types/business";

export const metadata: Metadata = {
  title: "Personel Detayı — İşletme Paneli — QR Platform",
};

export interface BusinessUserDetailPageProps {
  params: { membershipId: string };
}

export default async function BusinessUserDetailPage({ params }: BusinessUserDetailPageProps) {
  const user = await requireUser([ROLES.TENANT_OWNER, ROLES.BRANCH_MANAGER, ROLES.MENU_EDITOR]);

  if (!user.permissions.includes(PERMISSIONS.USER_READ)) {
    return <PermissionDenied />;
  }

  const [membership, branchesPage] = await Promise.all([
    serverFetch<BusinessMembershipDetail>(`/business/users/${params.membershipId}`),
    serverFetch<PaginatedResult<BusinessBranch>>("/business/branches?pageSize=100&sortBy=name&sortDir=asc"),
  ]);

  if (!membership) {
    return <EmptyState icon={UserX} title="Kullanıcı bulunamadı" description="Bu kullanıcı mevcut değil ya da erişiminiz yok." />;
  }

  return (
    <>
      <PageHeader title={`${membership.user.firstName} ${membership.user.lastName}`} subtitle={membership.user.email} />
      <BusinessUserDetailView
        membership={membership}
        branches={branchesPage?.items ?? []}
        canUpdate={user.permissions.includes(PERMISSIONS.USER_UPDATE)}
        canRevokeSessions={user.permissions.includes(PERMISSIONS.USER_SESSION_REVOKE)}
        canResetPassword={user.permissions.includes(PERMISSIONS.USER_PASSWORD_RESET)}
        isBranchManager={user.role === ROLES.BRANCH_MANAGER}
      />
    </>
  );
}

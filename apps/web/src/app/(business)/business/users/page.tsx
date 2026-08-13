import { PERMISSIONS, ROLES } from "@qr-platform/permissions";
import { PageHeader } from "@qr-platform/ui";
import type { Metadata } from "next";

import { PermissionDenied } from "@/features/business/shared/components/PermissionDenied";
import { BusinessUsersTable } from "@/features/business/users/components/BusinessUsersTable";
import { requireUser } from "@/lib/auth/require-user";
import { serverFetch } from "@/lib/server-fetch";
import type { BusinessBranch, BusinessMembership, ListUsersParams, PaginatedResult } from "@/types/business";

export const metadata: Metadata = {
  title: "Personel — İşletme Paneli — QR Platform",
};

export interface BusinessUsersPageProps {
  searchParams: { q?: string; role?: string; branchId?: string; status?: string; page?: string };
}

const EMPTY_RESULT: PaginatedResult<BusinessMembership> = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };

export default async function BusinessUsersPage({ searchParams }: BusinessUsersPageProps) {
  const user = await requireUser([ROLES.TENANT_OWNER, ROLES.BRANCH_MANAGER, ROLES.MENU_EDITOR]);

  if (!user.permissions.includes(PERMISSIONS.USER_READ)) {
    return <PermissionDenied />;
  }

  const params: ListUsersParams = {
    q: searchParams.q,
    role: searchParams.role as ListUsersParams["role"] | undefined,
    branchId: searchParams.branchId,
    status: searchParams.status as ListUsersParams["status"] | undefined,
    page: searchParams.page ? Number(searchParams.page) : 1,
  };

  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.role) query.set("role", params.role);
  if (params.branchId) query.set("branchId", params.branchId);
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page));

  const [data, branchesPage] = await Promise.all([
    serverFetch<PaginatedResult<BusinessMembership>>(`/business/users?${query.toString()}`),
    serverFetch<PaginatedResult<BusinessBranch>>("/business/branches?pageSize=100&sortBy=name&sortDir=asc"),
  ]);

  return (
    <>
      <PageHeader title="Personel" subtitle="İşletmenizin personelini yönetin." />
      <BusinessUsersTable
        data={data ?? EMPTY_RESULT}
        params={params}
        branches={branchesPage?.items ?? []}
        canCreate={user.permissions.includes(PERMISSIONS.USER_CREATE)}
        showBranchFilter={user.role === ROLES.TENANT_OWNER}
      />
    </>
  );
}

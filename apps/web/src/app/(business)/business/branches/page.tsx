import { PERMISSIONS, ROLES } from "@qr-platform/permissions";
import { PageHeader } from "@qr-platform/ui";
import type { Metadata } from "next";

import { BranchesTable } from "@/features/business/branches/components/BranchesTable";
import { PermissionDenied } from "@/features/business/shared/components/PermissionDenied";
import { requireUser } from "@/lib/auth/require-user";
import { serverFetch } from "@/lib/server-fetch";
import type { BusinessBranch, ListBranchesParams, PaginatedResult } from "@/types/business";

export const metadata: Metadata = {
  title: "Şubeler — İşletme Paneli — QR Platform",
};

export interface BusinessBranchesPageProps {
  searchParams: { q?: string; status?: string; page?: string };
}

const EMPTY_RESULT: PaginatedResult<BusinessBranch> = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };

export default async function BusinessBranchesPage({ searchParams }: BusinessBranchesPageProps) {
  const user = await requireUser([ROLES.TENANT_OWNER, ROLES.BRANCH_MANAGER, ROLES.MENU_EDITOR]);

  if (!user.permissions.includes(PERMISSIONS.BRANCH_READ)) {
    return <PermissionDenied />;
  }

  const params: ListBranchesParams = {
    q: searchParams.q,
    status: searchParams.status as BusinessBranch["status"] | undefined,
    page: searchParams.page ? Number(searchParams.page) : 1,
  };

  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page));

  const data = (await serverFetch<PaginatedResult<BusinessBranch>>(`/business/branches?${query.toString()}`)) ?? EMPTY_RESULT;

  return (
    <>
      <PageHeader title="Şubeler" subtitle="İşletmenizin şubelerini yönetin." />
      <BranchesTable data={data} params={params} canCreate={user.permissions.includes(PERMISSIONS.BRANCH_CREATE)} />
    </>
  );
}

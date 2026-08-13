import { PERMISSIONS, ROLES } from "@qr-platform/permissions";
import { PageHeader } from "@qr-platform/ui";
import type { Metadata } from "next";

import { BusinessActivityTable } from "@/features/business/activity/components/BusinessActivityTable";
import { PermissionDenied } from "@/features/business/shared/components/PermissionDenied";
import { requireUser } from "@/lib/auth/require-user";
import { serverFetch } from "@/lib/server-fetch";
import type { BusinessAuditLog, ListActivityParams, PaginatedResult } from "@/types/business";

export const metadata: Metadata = {
  title: "Aktivite — İşletme Paneli — QR Platform",
};

export interface BusinessActivityPageProps {
  searchParams: { action?: string; entity?: string; requestId?: string; page?: string };
}

const EMPTY_RESULT: PaginatedResult<BusinessAuditLog> = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };

export default async function BusinessActivityPage({ searchParams }: BusinessActivityPageProps) {
  const user = await requireUser([ROLES.TENANT_OWNER, ROLES.BRANCH_MANAGER, ROLES.MENU_EDITOR]);

  if (!user.permissions.includes(PERMISSIONS.BUSINESS_ACTIVITY_READ)) {
    return <PermissionDenied />;
  }

  const params: ListActivityParams = {
    action: searchParams.action,
    entity: searchParams.entity,
    requestId: searchParams.requestId,
    page: searchParams.page ? Number(searchParams.page) : 1,
  };

  const query = new URLSearchParams();
  if (params.action) query.set("action", params.action);
  if (params.entity) query.set("entity", params.entity);
  if (params.requestId) query.set("requestId", params.requestId);
  query.set("page", String(params.page));

  const data = (await serverFetch<PaginatedResult<BusinessAuditLog>>(`/business/activity?${query.toString()}`)) ?? EMPTY_RESULT;

  return (
    <>
      <PageHeader title="Aktivite" subtitle="İşletmenizdeki tüm işlem kayıtları." />
      <BusinessActivityTable data={data} params={params} />
    </>
  );
}

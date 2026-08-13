import { PageHeader } from "@qr-platform/ui";
import type { Metadata } from "next";

import { AuditLogsTable } from "@/features/admin/audit/components/AuditLogsTable";
import { serverFetch } from "@/lib/server-fetch";
import type { AdminAuditLog, PaginatedResult } from "@/types/admin";

export const metadata: Metadata = {
  title: "Audit Log — Süper Admin — QR Platform",
};

export interface AdminAuditLogsPageProps {
  searchParams: { action?: string; entity?: string; tenantId?: string; requestId?: string; page?: string };
}

const EMPTY_RESULT: PaginatedResult<AdminAuditLog> = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };

export default async function AdminAuditLogsPage({ searchParams }: AdminAuditLogsPageProps) {
  const params = {
    action: searchParams.action,
    entity: searchParams.entity,
    tenantId: searchParams.tenantId,
    requestId: searchParams.requestId,
    page: searchParams.page ? Number(searchParams.page) : 1,
  };

  const query = new URLSearchParams();
  if (params.action) query.set("action", params.action);
  if (params.entity) query.set("entity", params.entity);
  if (params.tenantId) query.set("tenantId", params.tenantId);
  if (params.requestId) query.set("requestId", params.requestId);
  query.set("page", String(params.page));

  const data = (await serverFetch<PaginatedResult<AdminAuditLog>>(`/admin/audit-logs?${query.toString()}`)) ?? EMPTY_RESULT;

  return (
    <>
      <PageHeader title="Audit Log" subtitle="Platform genelinde tüm işlem kayıtları." />
      <AuditLogsTable data={data} params={params} />
    </>
  );
}

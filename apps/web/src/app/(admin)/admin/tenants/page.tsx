import { PageHeader } from "@qr-platform/ui";
import type { Metadata } from "next";

import { TenantsTable } from "@/features/admin/tenants/components/TenantsTable";
import { serverFetch } from "@/lib/server-fetch";
import type { AdminTenant, ListTenantsParams, PaginatedResult } from "@/types/admin";

export const metadata: Metadata = {
  title: "İşletmeler — Süper Admin — QR Platform",
};

export interface AdminTenantsPageProps {
  searchParams: { q?: string; status?: string; sortBy?: string; sortDir?: string; page?: string };
}

const EMPTY_RESULT: PaginatedResult<AdminTenant> = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };

export default async function AdminTenantsPage({ searchParams }: AdminTenantsPageProps) {
  const params: ListTenantsParams = {
    q: searchParams.q,
    status: searchParams.status as AdminTenant["status"] | undefined,
    sortBy: searchParams.sortBy as ListTenantsParams["sortBy"] | undefined,
    sortDir: searchParams.sortDir as ListTenantsParams["sortDir"] | undefined,
    page: searchParams.page ? Number(searchParams.page) : 1,
  };

  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  query.set("page", String(params.page));

  const data = (await serverFetch<PaginatedResult<AdminTenant>>(`/admin/tenants?${query.toString()}`)) ?? EMPTY_RESULT;

  return (
    <>
      <PageHeader title="İşletmeler" subtitle="Platformdaki tüm işletmeleri yönetin." />
      <TenantsTable data={data} params={params} />
    </>
  );
}

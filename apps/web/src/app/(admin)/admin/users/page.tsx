import { PageHeader } from "@qr-platform/ui";
import type { Metadata } from "next";

import { UsersTable } from "@/features/admin/users/components/UsersTable";
import { serverFetch } from "@/lib/server-fetch";
import type { AdminTenant, AdminUserWithMemberships, PaginatedResult } from "@/types/admin";

export const metadata: Metadata = {
  title: "Kullanıcılar — Süper Admin — QR Platform",
};

export interface AdminUsersPageProps {
  searchParams: { q?: string; role?: string; tenantId?: string; status?: string; page?: string };
}

const EMPTY_USERS: PaginatedResult<AdminUserWithMemberships> = {
  items: [],
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = {
    q: searchParams.q,
    role: searchParams.role as AdminUserWithMemberships["tenantUsers"][number]["role"]["code"] | undefined,
    tenantId: searchParams.tenantId,
    status: searchParams.status as AdminUserWithMemberships["status"] | undefined,
    page: searchParams.page ? Number(searchParams.page) : 1,
  };

  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.role) query.set("role", params.role);
  if (params.tenantId) query.set("tenantId", params.tenantId);
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page));

  const [data, tenantsPage] = await Promise.all([
    serverFetch<PaginatedResult<AdminUserWithMemberships>>(`/admin/users?${query.toString()}`),
    serverFetch<PaginatedResult<AdminTenant>>("/admin/tenants?pageSize=100&sortBy=name&sortDir=asc"),
  ]);

  return (
    <>
      <PageHeader title="Kullanıcılar" subtitle="Platformdaki tüm kullanıcıları yönetin." />
      <UsersTable data={data ?? EMPTY_USERS} params={params} tenants={tenantsPage?.items ?? []} />
    </>
  );
}

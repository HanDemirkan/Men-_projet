import { EmptyState, PageHeader } from "@qr-platform/ui";
import { Building2 } from "lucide-react";
import type { Metadata } from "next";

import { TenantDetailView } from "@/features/admin/tenants/components/TenantDetailView";
import { serverFetch } from "@/lib/server-fetch";
import type { AdminAuditLog, AdminBranch, AdminTenantDetail, AdminTenantMembership, PaginatedResult } from "@/types/admin";

export const metadata: Metadata = {
  title: "İşletme Detayı — Süper Admin — QR Platform",
};

export interface AdminTenantDetailPageProps {
  params: { tenantId: string };
}

export default async function AdminTenantDetailPage({ params }: AdminTenantDetailPageProps) {
  const { tenantId } = params;

  const [tenant, users, branches, activity] = await Promise.all([
    serverFetch<AdminTenantDetail>(`/admin/tenants/${tenantId}`),
    serverFetch<AdminTenantMembership[]>(`/admin/tenants/${tenantId}/users`),
    serverFetch<AdminBranch[]>(`/admin/tenants/${tenantId}/branches`),
    serverFetch<PaginatedResult<AdminAuditLog>>(`/admin/tenants/${tenantId}/activity?page=1`),
  ]);

  if (!tenant) {
    return (
      <EmptyState
        icon={Building2}
        title="İşletme bulunamadı"
        description="Bu işletme mevcut değil ya da erişiminiz yok."
      />
    );
  }

  return (
    <>
      <PageHeader title={tenant.name} subtitle={`/${tenant.slug}`} />
      <TenantDetailView
        tenant={tenant}
        users={users ?? []}
        branches={branches ?? []}
        initialActivity={activity ?? { items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 }}
      />
    </>
  );
}

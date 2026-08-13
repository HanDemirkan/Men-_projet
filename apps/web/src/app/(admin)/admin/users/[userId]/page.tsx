import { EmptyState, PageHeader } from "@qr-platform/ui";
import { UserX } from "lucide-react";
import type { Metadata } from "next";

import { UserDetailView } from "@/features/admin/users/components/UserDetailView";
import { serverFetch } from "@/lib/server-fetch";
import type { AdminUserDetail } from "@/types/admin";

export const metadata: Metadata = {
  title: "Kullanıcı Detayı — Süper Admin — QR Platform",
};

export interface AdminUserDetailPageProps {
  params: { userId: string };
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const user = await serverFetch<AdminUserDetail>(`/admin/users/${params.userId}`);

  if (!user) {
    return <EmptyState icon={UserX} title="Kullanıcı bulunamadı" description="Bu kullanıcı mevcut değil ya da erişiminiz yok." />;
  }

  return (
    <>
      <PageHeader title={`${user.firstName} ${user.lastName}`} subtitle={user.email} />
      <UserDetailView user={user} />
    </>
  );
}

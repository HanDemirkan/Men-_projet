"use client";

import { ROLE_VALUES } from "@qr-platform/permissions";
import {
  Badge,
  EmptyState,
  Pagination,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qr-platform/ui";
import { Users2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ROUTES } from "@/config/routes";
import type { AdminTenantSummary, AdminUserWithMemberships, ListUsersParams, PaginatedResult } from "@/types/admin";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Süper Admin",
  TENANT_OWNER: "İşletme Sahibi",
  BRANCH_MANAGER: "Şube Müdürü",
  CASHIER: "Kasiyer",
  WAITER: "Garson",
  KITCHEN: "Mutfak",
  MENU_EDITOR: "Menü Editörü",
};

export interface UsersTableProps {
  data: PaginatedResult<AdminUserWithMemberships>;
  params: ListUsersParams;
  tenants: AdminTenantSummary[];
}

function buildHref(params: ListUsersParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.role) search.set("role", params.role);
  if (params.tenantId) search.set("tenantId", params.tenantId);
  if (params.status) search.set("status", params.status);
  if (params.page && params.page !== 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `${ROUTES.adminUsers}?${query}` : ROUTES.adminUsers;
}

export function UsersTable({ data, params, tenants }: UsersTableProps) {
  const router = useRouter();
  const [q, setQ] = useState(params.q ?? "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (q !== (params.q ?? "")) {
        router.push(buildHref({ ...params, q: q || undefined, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [q]);

  return (
    // min-w-0: see business/page.tsx's identical fix/comment.
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <SearchInput value={q} onChange={setQ} placeholder="Ad, soyad veya e-posta ara..." className="max-w-sm" />

        <Select
          value={params.role ?? "ALL"}
          onValueChange={(value) =>
            router.push(
              buildHref({ ...params, role: value === "ALL" ? undefined : (value as ListUsersParams["role"]), page: 1 }),
            )
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tüm roller</SelectItem>
            {ROLE_VALUES.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role] ?? role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.tenantId ?? "ALL"}
          onValueChange={(value) =>
            router.push(buildHref({ ...params, tenantId: value === "ALL" ? undefined : value, page: 1 }))
          }
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="İşletme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tüm işletmeler</SelectItem>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.status ?? "ALL"}
          onValueChange={(value) =>
            router.push(
              buildHref({
                ...params,
                status: value === "ALL" ? undefined : (value as ListUsersParams["status"]),
                page: 1,
              }),
            )
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tüm durumlar</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INACTIVE">Pasif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.items.length === 0 ? (
        <EmptyState icon={Users2} title="Kullanıcı bulunamadı" description="Arama veya filtre kriterlerinize uyan kullanıcı yok." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Roller</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Son Giriş</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-foreground">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.tenantUsers.map((m) => ROLE_LABELS[m.role.code] ?? m.role.code).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "ACTIVE" ? "success" : "secondary"}>
                        {user.status === "ACTIVE" ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("tr-TR") : "Hiç giriş yapmadı"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`${ROUTES.adminUsers}/${user.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Detay
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination page={data.page} pageCount={data.totalPages} onPageChange={(page) => router.push(buildHref({ ...params, page }))} />
        </>
      )}
    </div>
  );
}

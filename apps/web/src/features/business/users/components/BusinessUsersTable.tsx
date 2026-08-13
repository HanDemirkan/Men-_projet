"use client";

import { ROLE_VALUES } from "@qr-platform/permissions";
import { Badge, Button, EmptyState, Pagination, SearchInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@qr-platform/ui";
import { Plus, Users2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ROUTES } from "@/config/routes";
import type { BusinessBranch, BusinessMembership, ListUsersParams, PaginatedResult } from "@/types/business";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Süper Admin",
  TENANT_OWNER: "İşletme Sahibi",
  BRANCH_MANAGER: "Şube Müdürü",
  CASHIER: "Kasiyer",
  WAITER: "Garson",
  KITCHEN: "Mutfak",
  MENU_EDITOR: "Menü Editörü",
};

export interface BusinessUsersTableProps {
  data: PaginatedResult<BusinessMembership>;
  params: ListUsersParams;
  branches: BusinessBranch[];
  canCreate: boolean;
  showBranchFilter: boolean;
}

function buildHref(params: ListUsersParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.role) search.set("role", params.role);
  if (params.branchId) search.set("branchId", params.branchId);
  if (params.status) search.set("status", params.status);
  if (params.page && params.page !== 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `${ROUTES.businessUsers}?${query}` : ROUTES.businessUsers;
}

export function BusinessUsersTable({ data, params, branches, canCreate, showBranchFilter }: BusinessUsersTableProps) {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <SearchInput value={q} onChange={setQ} placeholder="Ad, soyad veya e-posta ara..." className="max-w-sm" />

          <Select
            value={params.role ?? "ALL"}
            onValueChange={(value) =>
              router.push(buildHref({ ...params, role: value === "ALL" ? undefined : (value as ListUsersParams["role"]), page: 1 }))
            }
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tüm roller</SelectItem>
              {ROLE_VALUES.filter((role) => role !== "SUPER_ADMIN").map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role] ?? role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showBranchFilter ? (
            <Select
              value={params.branchId ?? "ALL"}
              onValueChange={(value) => router.push(buildHref({ ...params, branchId: value === "ALL" ? undefined : value, page: 1 }))}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Şube" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm şubeler</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Select
            value={params.status ?? "ALL"}
            onValueChange={(value) =>
              router.push(buildHref({ ...params, status: value === "ALL" ? undefined : (value as ListUsersParams["status"]), page: 1 }))
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

        {canCreate ? (
          <Link href={ROUTES.businessNewUser}>
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Yeni Personel
            </Button>
          </Link>
        ) : null}
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
                  <TableHead>Rol</TableHead>
                  <TableHead>Şube</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Son Giriş</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell className="font-medium text-foreground">
                      {membership.user.firstName} {membership.user.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{membership.user.email}</TableCell>
                    <TableCell>{ROLE_LABELS[membership.role.code] ?? membership.role.code}</TableCell>
                    <TableCell>{membership.branch?.name ?? "İşletme Geneli"}</TableCell>
                    <TableCell>
                      <Badge variant={membership.status === "ACTIVE" ? "success" : "secondary"}>
                        {membership.status === "ACTIVE" ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {membership.user.lastLoginAt ? new Date(membership.user.lastLoginAt).toLocaleString("tr-TR") : "Hiç giriş yapmadı"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`${ROUTES.businessUsers}/${membership.id}`} className="text-sm font-medium text-primary hover:underline">
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

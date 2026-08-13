"use client";

import {
  Badge,
  Button,
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
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ROUTES } from "@/config/routes";
import type { AdminTenant, ListTenantsParams, PaginatedResult } from "@/types/admin";

export interface TenantsTableProps {
  data: PaginatedResult<AdminTenant>;
  params: ListTenantsParams;
}

const STATUS_LABELS: Record<string, string> = { ACTIVE: "Aktif", SUSPENDED: "Pasif" };

function buildHref(params: ListTenantsParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.sortBy) search.set("sortBy", params.sortBy);
  if (params.sortDir) search.set("sortDir", params.sortDir);
  if (params.page && params.page !== 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `${ROUTES.adminTenants}?${query}` : ROUTES.adminTenants;
}

interface SortableHeadProps {
  field: NonNullable<ListTenantsParams["sortBy"]>;
  label: string;
  params: ListTenantsParams;
  onSort: (field: NonNullable<ListTenantsParams["sortBy"]>) => void;
}

function SortableHead({ field, label, params, onSort }: SortableHeadProps) {
  const isActive = (params.sortBy ?? "createdAt") === field;
  const Icon = isActive ? (params.sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        {label}
        <Icon className={isActive ? "h-3 w-3 text-foreground" : "h-3 w-3 opacity-50"} aria-hidden="true" />
      </button>
    </TableHead>
  );
}

export function TenantsTable({ data, params }: TenantsTableProps) {
  const router = useRouter();
  const [q, setQ] = useState(params.q ?? "");

  const handleSort = (field: NonNullable<ListTenantsParams["sortBy"]>): void => {
    const currentField = params.sortBy ?? "createdAt";
    const currentDir = params.sortDir ?? "desc";
    const nextDir = currentField === field && currentDir === "asc" ? "desc" : "asc";
    router.push(buildHref({ ...params, sortBy: field, sortDir: nextDir, page: 1 }));
  };

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="İşletme adı veya slug ara..."
            className="max-w-sm"
          />
          <Select
            value={params.status ?? "ALL"}
            onValueChange={(value) =>
              router.push(
                buildHref({
                  ...params,
                  status: value === "ALL" ? undefined : (value as ListTenantsParams["status"]),
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
              <SelectItem value="SUSPENDED">Pasif</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link href={ROUTES.adminNewTenant}>
          <Button>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Yeni İşletme
          </Button>
        </Link>
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="İşletme bulunamadı"
          description={
            params.q || params.status
              ? "Arama veya filtre kriterlerinize uyan işletme yok."
              : "Platformda henüz kayıtlı işletme yok."
          }
          action={
            <Link href={ROUTES.adminNewTenant}>
              <Button variant="outline">İlk işletmeyi oluştur</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead field="name" label="İşletme Adı" params={params} onSort={handleSort} />
                  <SortableHead field="slug" label="Slug" params={params} onSort={handleSort} />
                  <SortableHead field="status" label="Durum" params={params} onSort={handleSort} />
                  <TableHead>Şube</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Menü</TableHead>
                  <SortableHead field="createdAt" label="Oluşturulma" params={params} onSort={handleSort} />
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium text-foreground">{tenant.name}</TableCell>
                    <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === "ACTIVE" ? "success" : "secondary"}>
                        {STATUS_LABELS[tenant.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{tenant._count.branches}</TableCell>
                    <TableCell>{tenant._count.tenantUsers}</TableCell>
                    <TableCell>{tenant._count.menus}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`${ROUTES.adminTenants}/${tenant.id}`}
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

          <Pagination
            page={data.page}
            pageCount={data.totalPages}
            onPageChange={(page) => router.push(buildHref({ ...params, page }))}
          />
        </>
      )}
    </div>
  );
}

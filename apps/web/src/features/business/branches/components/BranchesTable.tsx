"use client";

import { Badge, Button, EmptyState, Pagination, SearchInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@qr-platform/ui";
import { Plus, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ROUTES } from "@/config/routes";
import type { BusinessBranch, ListBranchesParams, PaginatedResult } from "@/types/business";

export interface BranchesTableProps {
  data: PaginatedResult<BusinessBranch>;
  params: ListBranchesParams;
  canCreate: boolean;
}

const STATUS_LABELS: Record<string, string> = { ACTIVE: "Aktif", INACTIVE: "Pasif" };

function buildHref(params: ListBranchesParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.page && params.page !== 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `${ROUTES.businessBranches}?${query}` : ROUTES.businessBranches;
}

export function BranchesTable({ data, params, canCreate }: BranchesTableProps) {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <SearchInput value={q} onChange={setQ} placeholder="Şube adı ara..." className="max-w-sm" />
          <Select
            value={params.status ?? "ALL"}
            onValueChange={(value) =>
              router.push(
                buildHref({ ...params, status: value === "ALL" ? undefined : (value as ListBranchesParams["status"]), page: 1 }),
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
        {canCreate ? (
          <Link href={ROUTES.businessNewBranch}>
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Yeni Şube
            </Button>
          </Link>
        ) : null}
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Şube bulunamadı"
          description={params.q || params.status ? "Arama veya filtre kriterlerinize uyan şube yok." : "Henüz kayıtlı şube yok."}
          action={
            canCreate ? (
              <Link href={ROUTES.businessNewBranch}>
                <Button variant="outline">İlk şubeyi oluştur</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Şube Adı</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Oluşturulma</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium text-foreground">{branch.name}</TableCell>
                    <TableCell className="text-muted-foreground">{branch.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={branch.status === "ACTIVE" ? "success" : "secondary"}>
                        {STATUS_LABELS[branch.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{branch._count.tenantUsers}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(branch.createdAt).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`${ROUTES.businessBranches}/${branch.id}`} className="text-sm font-medium text-primary hover:underline">
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

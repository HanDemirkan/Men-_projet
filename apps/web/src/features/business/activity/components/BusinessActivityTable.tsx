"use client";

import { Drawer, DrawerContent, EmptyState, Input, Label, Pagination, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@qr-platform/ui";
import { ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ROUTES } from "@/config/routes";
import type { BusinessAuditLog, ListActivityParams, PaginatedResult } from "@/types/business";

export interface BusinessActivityTableProps {
  data: PaginatedResult<BusinessAuditLog>;
  params: ListActivityParams;
}

function buildHref(params: ListActivityParams): string {
  const search = new URLSearchParams();
  if (params.action) search.set("action", params.action);
  if (params.entity) search.set("entity", params.entity);
  if (params.requestId) search.set("requestId", params.requestId);
  if (params.page && params.page !== 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `${ROUTES.businessActivity}?${query}` : ROUTES.businessActivity;
}

// oldValue/newValue already come pre-redacted from the API
// (see BusinessActivityService/redactAuditLog) - this just renders the JSON
// safely as text, no further parsing/eval.
function JsonBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">{JSON.stringify(value, null, 2)}</pre>;
}

export function BusinessActivityTable({ data, params }: BusinessActivityTableProps) {
  const router = useRouter();
  const [action, setAction] = useState(params.action ?? "");
  const [entity, setEntity] = useState(params.entity ?? "");
  const [selected, setSelected] = useState<BusinessAuditLog | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (action !== (params.action ?? "") || entity !== (params.entity ?? "")) {
        router.push(buildHref({ ...params, action: action || undefined, entity: entity || undefined, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [action, entity]);

  return (
    // min-w-0: see business/page.tsx's identical fix/comment.
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-col gap-1">
          <Label htmlFor="activity-action">Eylem</Label>
          <Input id="activity-action" value={action} onChange={(e) => setAction(e.target.value)} placeholder="ör. business.user.create" className="sm:w-64" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="activity-entity">Varlık</Label>
          <Input id="activity-entity" value={entity} onChange={(e) => setEntity(e.target.value)} placeholder="ör. TenantUser" className="sm:w-48" />
        </div>
      </div>

      {data.items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Kayıt bulunamadı" description="Filtre kriterlerinize uyan aktivite kaydı yok." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aktör</TableHead>
                  <TableHead>Eylem</TableHead>
                  <TableHead>Varlık</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((log) => (
                  <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelected(log)}>
                    <TableCell className="text-muted-foreground">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : "Sistem"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.action}</TableCell>
                    <TableCell>{log.entity}</TableCell>
                    <TableCell className="text-muted-foreground">{log.ip ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(log.createdAt).toLocaleString("tr-TR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination page={data.page} pageCount={data.totalPages} onPageChange={(page) => router.push(buildHref({ ...params, page }))} />
        </>
      )}

      <Drawer open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DrawerContent side="right" className="max-w-lg overflow-y-auto">
          {selected ? (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selected.action}</h3>
                <p className="text-sm text-muted-foreground">{new Date(selected.createdAt).toLocaleString("tr-TR")}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">Aktör</dt>
                  <dd className="text-foreground">{selected.user ? `${selected.user.firstName} ${selected.user.lastName}` : "Sistem"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">Varlık</dt>
                  <dd className="text-foreground">
                    {selected.entity} {selected.entityId ? `(${selected.entityId})` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">Request ID</dt>
                  <dd className="break-all text-foreground">{selected.requestId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">IP</dt>
                  <dd className="text-foreground">{selected.ip ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">User Agent</dt>
                  <dd className="truncate text-foreground">{selected.userAgent ?? "—"}</dd>
                </div>
              </dl>
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Eski Değer</p>
                <JsonBlock value={selected.oldValue} />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Yeni Değer</p>
                <JsonBlock value={selected.newValue} />
              </div>
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

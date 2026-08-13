"use client";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from "@qr-platform/ui";
import { Activity, ClipboardList, Layers, ShieldAlert, Store, Users2 } from "lucide-react";
import { useState } from "react";

import { listTenantActivity, updateTenant } from "@/services/admin-tenants.service";
import type {
  AdminAuditLog,
  AdminBranch,
  AdminTenantDetail,
  AdminTenantMembership,
  PaginatedResult,
} from "@/types/admin";

const STATUS_LABELS: Record<string, string> = { ACTIVE: "Aktif", SUSPENDED: "Pasif" };
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Süper Admin",
  TENANT_OWNER: "İşletme Sahibi",
  BRANCH_MANAGER: "Şube Müdürü",
  CASHIER: "Kasiyer",
  WAITER: "Garson",
  KITCHEN: "Mutfak",
  MENU_EDITOR: "Menü Editörü",
};

export interface TenantDetailViewProps {
  tenant: AdminTenantDetail;
  users: AdminTenantMembership[];
  branches: AdminBranch[];
  initialActivity: PaginatedResult<AdminAuditLog>;
}

export function TenantDetailView({ tenant: initialTenant, users, branches, initialActivity }: TenantDetailViewProps) {
  const [tenant, setTenant] = useState(initialTenant);
  const [activity, setActivity] = useState(initialActivity);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const nextStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  const toggleStatus = async (): Promise<void> => {
    setIsTogglingStatus(true);
    const result = await updateTenant(tenant.id, { status: nextStatus });
    setIsTogglingStatus(false);

    if (result.status === "error") {
      toast({ title: "Durum değiştirilemedi", description: result.message, variant: "destructive" });
      return;
    }

    setTenant((current) => ({ ...current, status: result.data.status }));
    toast({
      title: nextStatus === "ACTIVE" ? "İşletme aktif hale getirildi" : "İşletme pasif hale getirildi",
      variant: "success",
    });
  };

  const loadActivityPage = async (page: number): Promise<void> => {
    const result = await listTenantActivity(tenant.id, { page, pageSize: activity.pageSize });
    if (result.status === "success") {
      setActivity(result.data);
    }
  };

  return (
    // min-w-0: this is the flex item directly under PanelLayout's flex-col
    // root - without it, the tables nested several levels down (inside
    // Tabs/TabsContent) can force the whole page wider at narrow viewports.
    // See business/page.tsx's identical fix for the confirmed 320px failure.
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={tenant.status === "ACTIVE" ? "success" : "secondary"} className="text-sm">
          {STATUS_LABELS[tenant.status]}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          isLoading={isTogglingStatus}
          onClick={() => void toggleStatus()}
        >
          {nextStatus === "ACTIVE" ? "Aktif Yap" : "Pasif Yap"}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="branches">Şubeler</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="menus">Menüler</TabsTrigger>
          <TabsTrigger value="activity">Aktivite</TabsTrigger>
          <TabsTrigger value="security">Güvenlik</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-muted-foreground">İşletme Adı</dt>
                <dd className="text-sm text-foreground">{tenant.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-muted-foreground">Slug</dt>
                <dd className="text-sm text-foreground">{tenant.slug}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-muted-foreground">Telefon</dt>
                <dd className="text-sm text-foreground">{tenant.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-muted-foreground">Oluşturulma</dt>
                <dd className="text-sm text-foreground">{new Date(tenant.createdAt).toLocaleString("tr-TR")}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-muted-foreground">Sahip</dt>
                <dd className="text-sm text-foreground">
                  {tenant.owner ? `${tenant.owner.firstName} ${tenant.owner.lastName} (${tenant.owner.email})` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-muted-foreground">Şube / Kullanıcı</dt>
                <dd className="text-sm text-foreground">
                  {tenant._count.branches} şube · {tenant._count.tenantUsers} kullanıcı
                </dd>
              </div>
            </dl>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="mt-4">
          {branches.length === 0 ? (
            <EmptyState icon={Store} title="Şube yok" description="Bu işletmenin henüz kayıtlı şubesi yok." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Şube Adı</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Oluşturulma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium text-foreground">{branch.name}</TableCell>
                      <TableCell className="text-muted-foreground">{branch.phone ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={branch.status === "ACTIVE" ? "success" : "secondary"}>
                          {branch.status === "ACTIVE" ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(branch.createdAt).toLocaleDateString("tr-TR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          {users.length === 0 ? (
            <EmptyState icon={Users2} title="Kullanıcı yok" description="Bu işletmeye bağlı kullanıcı yok." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Şube</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell className="font-medium text-foreground">
                        {membership.user.firstName} {membership.user.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{membership.user.email}</TableCell>
                      <TableCell>{ROLE_LABELS[membership.role.code] ?? membership.role.code}</TableCell>
                      <TableCell>{membership.branch?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={membership.status === "ACTIVE" ? "success" : "secondary"}>
                          {membership.status === "ACTIVE" ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="menus" className="mt-4">
          <Card>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-foreground">{tenant._count.menus} menü</span>
              </div>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-foreground">{tenant._count.products} ürün</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          {activity.items.length === 0 ? (
            <EmptyState icon={Activity} title="Aktivite yok" description="Bu işletme için henüz audit kaydı yok." />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Eylem</TableHead>
                      <TableHead>Varlık</TableHead>
                      <TableHead>Aktör</TableHead>
                      <TableHead>Tarih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activity.items.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">{log.action}</TableCell>
                        <TableCell>{log.entity}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("tr-TR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination page={activity.page} pageCount={activity.totalPages} onPageChange={(p) => void loadActivityPage(p)} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  İşletme durumu: {STATUS_LABELS[tenant.status]}
                </p>
                <p className="text-sm text-muted-foreground">
                  İşletmeyi pasif hale getirmek, bu işletmeye bağlı kullanıcıların giriş yapmasını engellemez ancak
                  storefront ve panel erişimini kısıtlamak için ilk adımdır. Kullanıcı bazlı erişimi sonlandırmak
                  için Kullanıcılar ekranından ilgili hesabı pasif yapın veya oturumlarını sonlandırın.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

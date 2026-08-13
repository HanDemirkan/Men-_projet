import {
  Card,
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qr-platform/ui";
import {
  Activity,
  AlertTriangle,
  Building2,
  CircleSlash2,
  LogIn,
  Package,
  Sparkles,
  Store,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";

import { serverFetch } from "@/lib/server-fetch";
import type { AdminDashboard } from "@/types/admin";

export const metadata: Metadata = {
  title: "Süper Admin Paneli — QR Platform",
};

export default async function AdminPage() {
  const dashboard = await serverFetch<AdminDashboard>("/admin/dashboard");

  if (!dashboard) {
    return (
      <>
        <PageHeader title="Genel Bakış" subtitle="Platformdaki tüm işletmelerin özeti." />
        <EmptyState icon={AlertTriangle} title="Panel verileri alınamadı" description="Şu anda özet veriler görüntülenemiyor." />
      </>
    );
  }

  const stats = [
    { label: "Toplam İşletme", value: String(dashboard.totalTenants), icon: Store },
    { label: "Aktif İşletme", value: String(dashboard.activeTenants), icon: Building2 },
    { label: "Pasif İşletme", value: String(dashboard.inactiveTenants), icon: CircleSlash2 },
    { label: "Toplam Kullanıcı", value: String(dashboard.totalUsers), icon: Users },
    { label: "Toplam Şube", value: String(dashboard.totalBranches), icon: Building2 },
    { label: "Toplam Menü", value: String(dashboard.totalMenus), icon: UtensilsCrossed },
    { label: "Toplam Ürün", value: String(dashboard.totalProducts), icon: Package },
    { label: "Son 7 Günde Yeni İşletme", value: String(dashboard.newTenantsLast7Days), icon: Sparkles },
    { label: "Son 7 Günde Giriş", value: String(dashboard.loginsLast7Days), icon: LogIn },
  ] satisfies Array<{ label: string; value: string; icon: LucideIcon }>;

  return (
    <>
      <PageHeader title="Genel Bakış" subtitle="Platformdaki tüm işletmelerin gerçek zamanlı özeti." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-foreground">Sistem Durumu</h3>
          <StatusBadge
            state={dashboard.systemHealth.status === "healthy" ? "up" : "down"}
            label={dashboard.systemHealth.status === "healthy" ? "Sağlıklı" : "Sorunlu"}
          />
        </div>
      </Card>

      {/* min-w-0: see business/page.tsx's own comment on the identical pattern. */}
      <div className="flex min-w-0 flex-col gap-2">
        <h3 className="font-heading text-sm font-semibold text-foreground">Son Audit Kayıtları</h3>
        {dashboard.recentAuditLogs.length === 0 ? (
          <EmptyState icon={Activity} title="Henüz kayıt yok" description="Platformda henüz bir audit kaydı oluşmadı." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aktör</TableHead>
                  <TableHead>Eylem</TableHead>
                  <TableHead>Varlık</TableHead>
                  <TableHead>İşletme</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.recentAuditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : "Sistem"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.action}</TableCell>
                    <TableCell>{log.entity}</TableCell>
                    <TableCell className="text-muted-foreground">{log.tenant?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("tr-TR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}

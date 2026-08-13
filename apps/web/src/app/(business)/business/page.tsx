import { ROLES } from "@qr-platform/permissions";
import {
  Card,
  EmptyState,
  PageHeader,
  StatCard,
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
  CheckCircle2,
  Eye,
  EyeOff,
  ListTree,
  Package,
  ScanLine,
  UserCircle2,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/config/routes";
import { getMockStats } from "@/fixtures/stats.fixture";
import { requireUser } from "@/lib/auth/require-user";
import { serverFetch } from "@/lib/server-fetch";
import type { BusinessDashboard } from "@/types/business";

export const metadata: Metadata = {
  title: "İşletme Paneli — QR Platform",
};

export default async function BusinessPage() {
  const user = await requireUser([ROLES.TENANT_OWNER, ROLES.BRANCH_MANAGER, ROLES.MENU_EDITOR]);

  // Only TENANT_OWNER/BRANCH_MANAGER have business.dashboard.read - MENU_EDITOR
  // still lands on /business (layout allows it, for the sidebar's menu links)
  // but sees their own real menu-editing stats instead of a dashboard they
  // have no permission to read.
  if (user.role === ROLES.MENU_EDITOR) {
    const stats = getMockStats(ROLES.MENU_EDITOR);
    return (
      <>
        <PageHeader title="Genel Bakış" subtitle="Menü düzenleme özetiniz." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} trend={stat.trend} />
          ))}
        </div>
        <EmptyState
          icon={UtensilsCrossed}
          title="Menü yönetimine buradan devam edin"
          description="İşletme geneli özet metrikleri yalnızca işletme sahibi ve şube müdürü rolüne açıktır."
          action={
            <Link href={ROUTES.businessMenus} className="text-sm font-medium text-primary hover:underline">
              Menülere git
            </Link>
          }
        />
      </>
    );
  }

  const dashboard = await serverFetch<BusinessDashboard>("/business/dashboard");

  if (!dashboard) {
    return (
      <>
        <PageHeader title="Genel Bakış" subtitle="İşletmenizin gerçek zamanlı özeti." />
        <EmptyState
          icon={AlertTriangle}
          title="Panel verileri alınamadı"
          description="Şu anda özet veriler görüntülenemiyor."
        />
      </>
    );
  }

  const stats = [
    { label: "Toplam Şube", value: String(dashboard.totalBranches), icon: Building2 },
    { label: "Toplam Kullanıcı", value: String(dashboard.totalUsers), icon: Users },
    { label: "Aktif Menü", value: String(dashboard.activeMenus), icon: UtensilsCrossed },
    { label: "Toplam Kategori", value: String(dashboard.totalCategories), icon: ListTree },
    { label: "Toplam Ürün", value: String(dashboard.totalProducts), icon: Package },
    { label: "Yayındaki Ürün", value: String(dashboard.publishedProducts), icon: CheckCircle2 },
    { label: "Pasif Ürün", value: String(dashboard.inactiveProducts), icon: EyeOff },
    { label: "QR Görüntülenme", value: String(dashboard.qrViewCount), icon: ScanLine },
    { label: "Son 7 Günde Görüntülenme", value: String(dashboard.viewsLast7Days), icon: Eye },
    { label: "Profil Tamamlanma", value: `%${dashboard.profileCompletionPercent}`, icon: UserCircle2 },
  ] satisfies Array<{ label: string; value: string; icon: LucideIcon }>;

  return (
    <>
      <PageHeader title="Genel Bakış" subtitle="İşletmenizin gerçek zamanlı özeti." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
        ))}
      </div>

      {dashboard.profileCompletionPercent < 100 ? (
        <Card className="border-l-4 border-l-primary bg-primary/5 p-5">
          {/* flex-wrap: at 320px the icon+text block and the "Profili
              Tamamla" link (shrink-0) don't both fit on one row - without
              wrap the link gets pushed 6px past the viewport edge (a real,
              confirmed 320px overflow failure, not hypothetical). */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <UserCircle2 className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-heading text-sm font-semibold text-foreground">İşletme profiliniz eksik</h3>
                <p className="text-sm text-muted-foreground">
                  Profil tamamlanma oranınız %{dashboard.profileCompletionPercent}. Storefront&apos;unuzun eksiksiz
                  görünmesi için profili tamamlayın.
                </p>
              </div>
            </div>
            <Link
              href={ROUTES.businessProfile}
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              Profili Tamamla
            </Link>
          </div>
        </Card>
      ) : null}

      {/* min-w-0: without it, this flex-col item's default min-width:auto
          lets the table below force the whole page wider at narrow
          viewports - overflow-x-auto on its own only lets the *table*
          scroll internally, it doesn't stop the ancestor from growing to
          fit the table's intrinsic content width (confirmed via a real
          320px overflow test failure, not a hypothetical). */}
      <div className="flex min-w-0 flex-col gap-2">
        <h3 className="font-heading text-sm font-semibold text-foreground">Son Aktiviteler</h3>
        {dashboard.recentActivity.length === 0 ? (
          <EmptyState icon={Activity} title="Henüz kayıt yok" description="İşletmenizde henüz bir audit kaydı oluşmadı." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aktör</TableHead>
                  <TableHead>Eylem</TableHead>
                  <TableHead>Varlık</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.recentActivity.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : "Sistem"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.action}</TableCell>
                    <TableCell>{log.entity}</TableCell>
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

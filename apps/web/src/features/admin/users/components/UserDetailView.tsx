"use client";

import { Badge, Button, Card, EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, toast } from "@qr-platform/ui";
import { KeyRound, ShieldOff } from "lucide-react";
import { useState } from "react";

import { revokeUserSessions, updateUserStatus } from "@/services/admin-users.service";
import type { AdminUserDetail } from "@/types/admin";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Süper Admin",
  TENANT_OWNER: "İşletme Sahibi",
  BRANCH_MANAGER: "Şube Müdürü",
  CASHIER: "Kasiyer",
  WAITER: "Garson",
  KITCHEN: "Mutfak",
  MENU_EDITOR: "Menü Editörü",
};

export interface UserDetailViewProps {
  user: AdminUserDetail;
}

export function UserDetailView({ user: initialUser }: UserDetailViewProps) {
  const [user, setUser] = useState(initialUser);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const toggleStatus = async (): Promise<void> => {
    setIsTogglingStatus(true);
    const result = await updateUserStatus(user.id, nextStatus);
    setIsTogglingStatus(false);

    if (result.status === "error") {
      toast({ title: "Durum değiştirilemedi", description: result.message, variant: "destructive" });
      return;
    }

    setUser((current) => ({ ...current, status: result.data.status }));
    toast({ title: nextStatus === "ACTIVE" ? "Kullanıcı aktif hale getirildi" : "Kullanıcı pasif hale getirildi", variant: "success" });
  };

  const revokeSession = async (sessionId: string): Promise<void> => {
    setRevokingSessionId(sessionId);
    const result = await revokeUserSessions(user.id, sessionId);
    setRevokingSessionId(null);

    if (result.status === "error") {
      toast({ title: "Oturum sonlandırılamadı", description: result.message, variant: "destructive" });
      return;
    }

    setUser((current) => ({ ...current, sessions: current.sessions.filter((s) => s.id !== sessionId) }));
    toast({ title: "Oturum sonlandırıldı", variant: "success" });
  };

  const revokeAllSessions = async (): Promise<void> => {
    const result = await revokeUserSessions(user.id);

    if (result.status === "error") {
      toast({ title: "Oturumlar sonlandırılamadı", description: result.message, variant: "destructive" });
      return;
    }

    setUser((current) => ({ ...current, sessions: [] }));
    toast({ title: `${result.data.revokedCount} oturum sonlandırıldı`, variant: "success" });
  };

  return (
    // min-w-0: see TenantDetailView's identical fix/comment.
    <div className="flex min-w-0 flex-col gap-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={user.status === "ACTIVE" ? "success" : "secondary"}>
              {user.status === "ACTIVE" ? "Aktif" : "Pasif"}
            </Badge>
            <Button variant="outline" size="sm" isLoading={isTogglingStatus} onClick={() => void toggleStatus()}>
              <ShieldOff className="h-4 w-4" aria-hidden="true" />
              {nextStatus === "ACTIVE" ? "Aktif Yap" : "Pasif Yap"}
            </Button>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Son Giriş</dt>
            <dd className="text-sm text-foreground">
              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("tr-TR") : "Hiç giriş yapmadı"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Kayıt Tarihi</dt>
            <dd className="text-sm text-foreground">{new Date(user.createdAt).toLocaleString("tr-TR")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">E-posta Doğrulama</dt>
            <dd className="text-sm text-foreground">{user.emailVerifiedAt ? "Doğrulandı" : "Doğrulanmadı"}</dd>
          </div>
        </dl>
      </Card>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">İşletme Üyelikleri</h3>
        {user.tenantUsers.length === 0 ? (
          <EmptyState title="Üyelik yok" description="Bu kullanıcının hiçbir işletmede üyeliği yok." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İşletme</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Şube</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.tenantUsers.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell className="font-medium text-foreground">
                      {membership.tenant?.name ?? "Platform (tenant bağımsız)"}
                    </TableCell>
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
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Oturumlar</h3>
          {user.sessions.length > 0 ? (
            <Button variant="outline" size="sm" onClick={() => void revokeAllSessions()}>
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Tümünü Sonlandır
            </Button>
          ) : null}
        </div>
        {user.sessions.length === 0 ? (
          <EmptyState title="Aktif oturum yok" description="Bu kullanıcının şu anda aktif bir oturumu yok." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP</TableHead>
                  <TableHead>Cihaz</TableHead>
                  <TableHead>Son Kullanım</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="text-muted-foreground">{session.ip ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {session.userAgent ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(session.lastUsedAt).toLocaleString("tr-TR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={revokingSessionId === session.id}
                        onClick={() => void revokeSession(session.id)}
                      >
                        Sonlandır
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">Son Aktiviteler</h3>
        {user.recentAuditLogs.length === 0 ? (
          <EmptyState title="Aktivite yok" description="Bu kullanıcı için henüz audit kaydı yok." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Eylem</TableHead>
                  <TableHead>Varlık</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.recentAuditLogs.map((log) => (
                  <TableRow key={log.id}>
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
    </div>
  );
}

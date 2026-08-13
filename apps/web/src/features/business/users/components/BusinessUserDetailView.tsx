"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ROLES } from "@qr-platform/permissions";
import type { Role } from "@qr-platform/permissions";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  Label,
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
  toast,
} from "@qr-platform/ui";
import { KeyRound, ShieldOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { resetBusinessUserPassword, revokeBusinessUserSessions, updateBusinessUser } from "@/services/business-users.service";
import type { BusinessBranch, BusinessMembershipDetail } from "@/types/business";

const ROLE_LABELS: Record<string, string> = {
  TENANT_OWNER: "İşletme Sahibi",
  BRANCH_MANAGER: "Şube Müdürü",
  CASHIER: "Kasiyer",
  WAITER: "Garson",
  KITCHEN: "Mutfak",
  MENU_EDITOR: "Menü Editörü",
};

const BRANCH_MANAGER_ASSIGNABLE_ROLES: readonly Role[] = [ROLES.CASHIER, ROLES.WAITER, ROLES.KITCHEN, ROLES.MENU_EDITOR];

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;
const setPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalıdır")
    .regex(PASSWORD_PATTERN, "Şifre en az bir harf ve bir rakam içermelidir"),
});
type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;

export interface BusinessUserDetailViewProps {
  membership: BusinessMembershipDetail;
  branches: BusinessBranch[];
  canUpdate: boolean;
  canRevokeSessions: boolean;
  canResetPassword: boolean;
  isBranchManager: boolean;
}

export function BusinessUserDetailView({
  membership: initialMembership,
  branches,
  canUpdate,
  canRevokeSessions,
  canResetPassword,
  isBranchManager,
}: BusinessUserDetailViewProps) {
  const [membership, setMembership] = useState(initialMembership);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isChangingBranch, setIsChangingBranch] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const assignableRoles = isBranchManager
    ? BRANCH_MANAGER_ASSIGNABLE_ROLES
    : (Object.keys(ROLE_LABELS) as Role[]);

  const nextStatus = membership.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const toggleStatus = async (): Promise<void> => {
    setIsTogglingStatus(true);
    const result = await updateBusinessUser(membership.id, { status: nextStatus });
    setIsTogglingStatus(false);

    if (result.status === "error") {
      toast({ title: "Durum değiştirilemedi", description: result.message, variant: "destructive" });
      return;
    }

    setMembership((current) => ({ ...current, status: result.data.status }));
    toast({ title: nextStatus === "ACTIVE" ? "Personel aktif hale getirildi" : "Personel pasif hale getirildi", variant: "success" });
  };

  const changeRole = async (role: Role): Promise<void> => {
    setIsChangingRole(true);
    const result = await updateBusinessUser(membership.id, { role });
    setIsChangingRole(false);

    if (result.status === "error") {
      toast({ title: "Rol değiştirilemedi", description: result.message, variant: "destructive" });
      return;
    }

    setMembership((current) => ({ ...current, role: result.data.role }));
    toast({ title: "Rol güncellendi", variant: "success" });
  };

  const changeBranch = async (branchId: string): Promise<void> => {
    setIsChangingBranch(true);
    const result = await updateBusinessUser(membership.id, { branchId: branchId === "NONE" ? null : branchId });
    setIsChangingBranch(false);

    if (result.status === "error") {
      toast({ title: "Şube değiştirilemedi", description: result.message, variant: "destructive" });
      return;
    }

    setMembership((current) => ({ ...current, branchId: result.data.branchId, branch: result.data.branch }));
    toast({ title: "Şube güncellendi", variant: "success" });
  };

  const revokeSession = async (sessionId: string): Promise<void> => {
    setRevokingSessionId(sessionId);
    const result = await revokeBusinessUserSessions(membership.id, sessionId);
    setRevokingSessionId(null);

    if (result.status === "error") {
      toast({ title: "Oturum sonlandırılamadı", description: result.message, variant: "destructive" });
      return;
    }

    setMembership((current) => ({ ...current, sessions: current.sessions.filter((s) => s.id !== sessionId) }));
    toast({ title: "Oturum sonlandırıldı", variant: "success" });
  };

  const revokeAllSessions = async (): Promise<void> => {
    const result = await revokeBusinessUserSessions(membership.id);

    if (result.status === "error") {
      toast({ title: "Oturumlar sonlandırılamadı", description: result.message, variant: "destructive" });
      return;
    }

    setMembership((current) => ({ ...current, sessions: [] }));
    toast({ title: `${result.data.revokedCount} oturum sonlandırıldı`, variant: "success" });
  };

  return (
    // min-w-0: see TenantDetailView's identical fix/comment.
    <div className="flex min-w-0 flex-col gap-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-foreground">
              {membership.user.firstName} {membership.user.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{membership.user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={membership.status === "ACTIVE" ? "success" : "secondary"}>
              {membership.status === "ACTIVE" ? "Aktif" : "Pasif"}
            </Badge>
            {canUpdate ? (
              <Button variant="outline" size="sm" isLoading={isTogglingStatus} onClick={() => void toggleStatus()}>
                <ShieldOff className="h-4 w-4" aria-hidden="true" />
                {nextStatus === "ACTIVE" ? "Aktif Yap" : "Pasif Yap"}
              </Button>
            ) : null}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Son Giriş</dt>
            <dd className="text-sm text-foreground">
              {membership.user.lastLoginAt ? new Date(membership.user.lastLoginAt).toLocaleString("tr-TR") : "Hiç giriş yapmadı"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Üyelik Tarihi</dt>
            <dd className="text-sm text-foreground">{new Date(membership.createdAt).toLocaleString("tr-TR")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Aktif Oturum</dt>
            <dd className="text-sm text-foreground">{membership.sessions.length}</dd>
          </div>
        </dl>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Rol</Label>
            {canUpdate ? (
              <Select value={membership.role.code} onValueChange={(value) => void changeRole(value as Role)} disabled={isChangingRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role] ?? role}
                    </SelectItem>
                  ))}
                  {!assignableRoles.includes(membership.role.code) ? (
                    <SelectItem value={membership.role.code}>{ROLE_LABELS[membership.role.code] ?? membership.role.code}</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-foreground">{ROLE_LABELS[membership.role.code] ?? membership.role.code}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Şube</Label>
            {canUpdate && !isBranchManager ? (
              <Select value={membership.branch?.id ?? "NONE"} onValueChange={(value) => void changeBranch(value)} disabled={isChangingBranch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">İşletme Geneli (şubesiz)</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-foreground">{membership.branch?.name ?? "İşletme Geneli"}</p>
            )}
          </div>
        </div>

        {canResetPassword ? (
          <div className="mt-6">
            <Button variant="outline" size="sm" onClick={() => setPasswordDialogOpen(true)}>
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Geçici Şifre Belirle
            </Button>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Oturumlar</h3>
          {canRevokeSessions && membership.sessions.length > 0 ? (
            <Button variant="outline" size="sm" onClick={() => void revokeAllSessions()}>
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Tümünü Sonlandır
            </Button>
          ) : null}
        </div>
        {membership.sessions.length === 0 ? (
          <EmptyState title="Aktif oturum yok" description="Bu kullanıcının şu anda aktif bir oturumu yok." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP</TableHead>
                  <TableHead>Cihaz</TableHead>
                  <TableHead>Son Kullanım</TableHead>
                  {canRevokeSessions ? <TableHead className="text-right">İşlem</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {membership.sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="text-muted-foreground">{session.ip ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{session.userAgent ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(session.lastUsedAt).toLocaleString("tr-TR")}</TableCell>
                    {canRevokeSessions ? (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" isLoading={revokingSessionId === session.id} onClick={() => void revokeSession(session.id)}>
                          Sonlandır
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">Son Aktiviteler</h3>
        {membership.recentAuditLogs.length === 0 ? (
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
                {membership.recentAuditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.action}</TableCell>
                    <TableCell>{log.entity}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(log.createdAt).toLocaleString("tr-TR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <SetPasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        membershipId={membership.id}
      />
    </div>
  );
}

function SetPasswordDialog({
  open,
  onOpenChange,
  membershipId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membershipId: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordFormValues>({ resolver: zodResolver(setPasswordSchema), defaultValues: { newPassword: "" } });

  const onSubmit = async (values: SetPasswordFormValues): Promise<void> => {
    const result = await resetBusinessUserPassword(membershipId, values.newPassword);

    if (result.status === "error") {
      toast({ title: "Şifre belirlenemedi", description: result.message, variant: "destructive" });
      return;
    }

    toast({ title: "Yeni geçici şifre belirlendi, kullanıcının mevcut oturumları sonlandırıldı", variant: "success" });
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Geçici Şifre Belirle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Yeni şifre belirlendiğinde bu kullanıcının tüm mevcut oturumları sonlandırılır.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">Yeni Şifre</Label>
            <Input id="new-password" type="password" {...register("newPassword")} aria-invalid={errors.newPassword ? true : undefined} />
            {errors.newPassword ? <p className="text-sm text-destructive">{errors.newPassword.message}</p> : null}
          </div>
          <DialogFooter>
            <Button type="submit" isLoading={isSubmitting}>
              Şifreyi Belirle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Shared by prisma/seed.ts (dev/demo data), prisma/bootstrap-admin.ts
// (`pnpm bootstrap:admin`, production), and apps/api's DevelopmentBootstrapService
// (automatic dev-only super admin on `pnpm dev`) - the permission/role catalog
// and the idempotent "create a SUPER_ADMIN if one doesn't exist yet" logic
// must be identical everywhere, never duplicated per caller.
import { PERMISSIONS, PERMISSION_GROUPS, ROLES, ROLE_PERMISSIONS } from "@qr-platform/permissions";
import type { PermissionCode, Role } from "@qr-platform/permissions";

import { prisma } from "./client";

export const PERMISSION_NAMES: Record<PermissionCode, string> = {
  [PERMISSIONS.TENANT_READ]: "İşletme Görüntüleme",
  [PERMISSIONS.TENANT_UPDATE]: "İşletme Düzenleme",
  [PERMISSIONS.BRANCH_READ]: "Şube Görüntüleme",
  [PERMISSIONS.BRANCH_UPDATE]: "Şube Düzenleme",
  [PERMISSIONS.MENU_READ]: "Menü Görüntüleme",
  [PERMISSIONS.MENU_WRITE]: "Menü Düzenleme",
  [PERMISSIONS.CATEGORY_READ]: "Kategori Görüntüleme",
  [PERMISSIONS.CATEGORY_WRITE]: "Kategori Düzenleme",
  [PERMISSIONS.PRODUCT_READ]: "Ürün Görüntüleme",
  [PERMISSIONS.PRODUCT_WRITE]: "Ürün Düzenleme",
  [PERMISSIONS.ORDER_READ]: "Sipariş Görüntüleme",
  [PERMISSIONS.ORDER_WRITE]: "Sipariş Oluşturma/Düzenleme",
  [PERMISSIONS.CASHIER_PAYMENT]: "Ödeme Alma",
  [PERMISSIONS.REPORT_VIEW]: "Rapor Görüntüleme",
  [PERMISSIONS.USER_INVITE]: "Kullanıcı Davet Etme",
  [PERMISSIONS.ROLE_MANAGE]: "Rol Yönetimi",
  [PERMISSIONS.PERMISSION_MANAGE]: "Yetki Yönetimi",
  [PERMISSIONS.MEDIA_UPLOAD]: "Medya Yükleme",
  [PERMISSIONS.MEDIA_MANAGE]: "Medya Silme/Yönetme",
  [PERMISSIONS.THEME_UPDATE]: "Tema Düzenleme",
  [PERMISSIONS.STOREFRONT_PUBLISH]: "Storefront Yayınlama",
  [PERMISSIONS.QR_GENERATE]: "QR Kod Üretme",
  [PERMISSIONS.ADMIN_DASHBOARD_READ]: "Süper Admin Panosu Görüntüleme",
  [PERMISSIONS.ADMIN_TENANT_READ]: "Süper Admin: İşletme Görüntüleme",
  [PERMISSIONS.ADMIN_TENANT_CREATE]: "Süper Admin: İşletme Oluşturma",
  [PERMISSIONS.ADMIN_TENANT_UPDATE]: "Süper Admin: İşletme Düzenleme",
  [PERMISSIONS.ADMIN_USER_READ]: "Süper Admin: Kullanıcı Görüntüleme",
  [PERMISSIONS.ADMIN_USER_UPDATE]: "Süper Admin: Kullanıcı Düzenleme",
  [PERMISSIONS.ADMIN_SESSION_REVOKE]: "Süper Admin: Oturum Sonlandırma",
  [PERMISSIONS.ADMIN_AUDIT_READ]: "Süper Admin: Audit Log Görüntüleme",
  [PERMISSIONS.ADMIN_SYSTEM_READ]: "Süper Admin: Sistem Durumu Görüntüleme",
  [PERMISSIONS.BUSINESS_DASHBOARD_READ]: "İşletme Panosu Görüntüleme",
  [PERMISSIONS.BRANCH_CREATE]: "Şube Oluşturma",
  [PERMISSIONS.USER_READ]: "İşletme Kullanıcılarını Görüntüleme",
  [PERMISSIONS.USER_CREATE]: "İşletme Kullanıcısı Oluşturma",
  [PERMISSIONS.USER_UPDATE]: "İşletme Kullanıcısı Düzenleme",
  [PERMISSIONS.USER_SESSION_REVOKE]: "Kullanıcı Oturumu Sonlandırma",
  [PERMISSIONS.USER_PASSWORD_RESET]: "Kullanıcı Şifresi Sıfırlama",
  [PERMISSIONS.BUSINESS_ACTIVITY_READ]: "İşletme Aktivite Kayıtlarını Görüntüleme",
  [PERMISSIONS.BUSINESS_SETTINGS_READ]: "İşletme Ayarlarını Görüntüleme",
  [PERMISSIONS.BUSINESS_SETTINGS_UPDATE]: "İşletme Ayarlarını Düzenleme",
};

export const ROLE_NAMES: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: "Süper Admin",
  [ROLES.TENANT_OWNER]: "İşletme Sahibi",
  [ROLES.BRANCH_MANAGER]: "Şube Müdürü",
  [ROLES.CASHIER]: "Kasiyer",
  [ROLES.WAITER]: "Garson",
  [ROLES.KITCHEN]: "Mutfak",
  [ROLES.MENU_EDITOR]: "Menü Editörü",
};

export async function seedPermissions(): Promise<void> {
  for (const code of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { code },
      update: { name: PERMISSION_NAMES[code], group: PERMISSION_GROUPS[code] },
      create: { code, name: PERMISSION_NAMES[code], group: PERMISSION_GROUPS[code] },
    });
  }
}

export async function seedRoles(): Promise<Record<Role, string>> {
  const roleIds: Partial<Record<Role, string>> = {};

  for (const code of Object.values(ROLES)) {
    // Prisma's compound-unique `where` input requires a non-null value even
    // though `tenantId` itself is nullable (Postgres treats each NULL as
    // distinct in a unique index, so `findUnique`/`upsert` can't target a
    // null-tenantId row via the compound key) - findFirst + create/update
    // is the correct pattern for system (tenantId: null) roles.
    const existing = await prisma.role.findFirst({ where: { tenantId: null, code } });
    const role = existing
      ? await prisma.role.update({
          where: { id: existing.id },
          data: { name: ROLE_NAMES[code], system: true },
        })
      : await prisma.role.create({
          data: { tenantId: null, code, name: ROLE_NAMES[code], system: true },
        });
    roleIds[code] = role.id;

    const permissionCodes = ROLE_PERMISSIONS[code];
    const permissions = await prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
    });

    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  return roleIds as Record<Role, string>;
}

// Shared by prisma/bootstrap-admin.ts and apps/api's DevelopmentBootstrapService -
// both take a single "full name" input field and need firstName/lastName for
// the User row.
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? fullName, lastName: parts.slice(1).join(" ") };
}

export interface CreateSuperAdminIfMissingInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
}

export type CreateSuperAdminIfMissingResult = { status: "created" | "exists" };

// Lower-level primitive underneath both `pnpm bootstrap:admin` (production,
// plaintext password in via prisma/bootstrap-admin.ts) and the development
// auto-bootstrap (apps/api DevelopmentBootstrapService) - takes an
// already-hashed password so hashing/validation stay each caller's own
// concern. Idempotency contract: never creates a second account for an email
// that already holds a platform-level SUPER_ADMIN membership, and never
// rewrites an existing account's password hash.
export async function createSuperAdminIfMissing(
  input: CreateSuperAdminIfMissingInput,
): Promise<CreateSuperAdminIfMissingResult> {
  await seedPermissions();
  const roleIds = await seedRoles();
  const superAdminRoleId = roleIds[ROLES.SUPER_ADMIN];

  return prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({ where: { email: input.email } });

    if (existingUser) {
      const existingMembership = await tx.tenantUser.findFirst({
        where: { tenantId: null, userId: existingUser.id, roleId: superAdminRoleId },
      });

      if (existingMembership) {
        return { status: "exists" };
      }

      // Account exists (e.g. created for another role, or a prior partial
      // run) but doesn't hold the platform-level SUPER_ADMIN membership yet -
      // attach it. Password is never touched on this path.
      await tx.tenantUser.create({
        data: { tenantId: null, userId: existingUser.id, roleId: superAdminRoleId },
      });
      return { status: "created" };
    }

    const user = await tx.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash: input.passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
    await tx.tenantUser.create({
      data: { tenantId: null, userId: user.id, roleId: superAdminRoleId },
    });

    return { status: "created" };
  });
}

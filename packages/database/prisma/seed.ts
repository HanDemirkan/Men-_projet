// Sprint 2 seed: real permissions, system roles, and a demo tenant with one
// user per role so the auth system can be exercised end to end. There are
// no tenant/branch/user CRUD endpoints yet (Sprint 2 scope is auth only),
// so this script is the only way this data gets created.
import { PERMISSIONS, PERMISSION_GROUPS, ROLES, ROLE_PERMISSIONS } from "@qr-platform/permissions";
import type { PermissionCode, Role } from "@qr-platform/permissions";
import * as argon2 from "argon2";

import { prisma } from "../src/client";

const PERMISSION_NAMES: Record<PermissionCode, string> = {
  [PERMISSIONS.TENANT_READ]: "İşletme Görüntüleme",
  [PERMISSIONS.TENANT_UPDATE]: "İşletme Düzenleme",
  [PERMISSIONS.BRANCH_READ]: "Şube Görüntüleme",
  [PERMISSIONS.BRANCH_UPDATE]: "Şube Düzenleme",
  [PERMISSIONS.MENU_READ]: "Menü Görüntüleme",
  [PERMISSIONS.MENU_WRITE]: "Menü Düzenleme",
  [PERMISSIONS.PRODUCT_READ]: "Ürün Görüntüleme",
  [PERMISSIONS.PRODUCT_WRITE]: "Ürün Düzenleme",
  [PERMISSIONS.ORDER_READ]: "Sipariş Görüntüleme",
  [PERMISSIONS.ORDER_WRITE]: "Sipariş Oluşturma/Düzenleme",
  [PERMISSIONS.CASHIER_PAYMENT]: "Ödeme Alma",
  [PERMISSIONS.REPORT_VIEW]: "Rapor Görüntüleme",
  [PERMISSIONS.USER_INVITE]: "Kullanıcı Davet Etme",
  [PERMISSIONS.ROLE_MANAGE]: "Rol Yönetimi",
  [PERMISSIONS.PERMISSION_MANAGE]: "Yetki Yönetimi",
};

const ROLE_NAMES: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: "Süper Admin",
  [ROLES.TENANT_OWNER]: "İşletme Sahibi",
  [ROLES.BRANCH_MANAGER]: "Şube Müdürü",
  [ROLES.CASHIER]: "Kasiyer",
  [ROLES.WAITER]: "Garson",
  [ROLES.KITCHEN]: "Mutfak",
  [ROLES.MENU_EDITOR]: "Menü Editörü",
};

// Demo password for every seeded account. Documented here (and in the
// Sprint 2 delivery notes) - not a secret, this is local/dev seed data only.
const DEMO_PASSWORD = "Passw0rd!23";

interface DemoUserSeed {
  role: Role;
  firstName: string;
  lastName: string;
  email: string;
  tenantScoped: boolean; // false = platform-level (SUPER_ADMIN), tenantId null
  branchScoped: boolean; // true = assigned to the demo branch, false = tenant-wide
}

const DEMO_USERS: DemoUserSeed[] = [
  {
    role: ROLES.SUPER_ADMIN,
    firstName: "Elif",
    lastName: "Aydın",
    email: "elif.aydin@qrplatform.dev",
    tenantScoped: false,
    branchScoped: false,
  },
  {
    role: ROLES.TENANT_OWNER,
    firstName: "Mert",
    lastName: "Kaya",
    email: "mert.kaya@sahil-cafe.dev",
    tenantScoped: true,
    branchScoped: false,
  },
  {
    role: ROLES.BRANCH_MANAGER,
    firstName: "Zeynep",
    lastName: "Demir",
    email: "zeynep.demir@sahil-cafe.dev",
    tenantScoped: true,
    branchScoped: true,
  },
  {
    role: ROLES.MENU_EDITOR,
    firstName: "Can",
    lastName: "Öz",
    email: "can.oz@sahil-cafe.dev",
    tenantScoped: true,
    branchScoped: true,
  },
  {
    role: ROLES.CASHIER,
    firstName: "Ayşe",
    lastName: "Yıldız",
    email: "ayse.yildiz@sahil-cafe.dev",
    tenantScoped: true,
    branchScoped: true,
  },
  {
    role: ROLES.WAITER,
    firstName: "Burak",
    lastName: "Şahin",
    email: "burak.sahin@sahil-cafe.dev",
    tenantScoped: true,
    branchScoped: true,
  },
  {
    role: ROLES.KITCHEN,
    firstName: "Deniz",
    lastName: "Arslan",
    email: "deniz.arslan@sahil-cafe.dev",
    tenantScoped: true,
    branchScoped: true,
  },
];

async function seedPermissions(): Promise<void> {
  for (const code of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { code },
      update: { name: PERMISSION_NAMES[code], group: PERMISSION_GROUPS[code] },
      create: { code, name: PERMISSION_NAMES[code], group: PERMISSION_GROUPS[code] },
    });
  }
  console.log(`Seeded ${Object.values(PERMISSIONS).length} permissions.`);
}

async function seedRoles(): Promise<Record<Role, string>> {
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

  console.log(`Seeded ${Object.values(ROLES).length} system roles with their permissions.`);
  return roleIds as Record<Role, string>;
}

async function seedDemoTenant(): Promise<{ tenantId: string; branchId: string }> {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "sahil-cafe" },
    update: {},
    create: { name: "Sahil Cafe", slug: "sahil-cafe" },
  });

  const existingBranch = await prisma.branch.findFirst({ where: { tenantId: tenant.id } });
  const branch =
    existingBranch ??
    (await prisma.branch.create({ data: { tenantId: tenant.id, name: "Merkez Şube" } }));

  console.log(`Seeded demo tenant "${tenant.name}" (${tenant.slug}) with branch "${branch.name}".`);
  return { tenantId: tenant.id, branchId: branch.id };
}

async function seedDemoUsers(
  roleIds: Record<Role, string>,
  demoTenant: { tenantId: string; branchId: string },
): Promise<void> {
  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });

  for (const demoUser of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {},
      create: {
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        email: demoUser.email,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });

    const tenantId = demoUser.tenantScoped ? demoTenant.tenantId : null;
    const branchId = demoUser.branchScoped ? demoTenant.branchId : null;

    // Same nullable-compound-unique caveat as seedRoles() above.
    const existingMembership = await prisma.tenantUser.findFirst({
      where: { tenantId, userId: user.id },
    });

    if (existingMembership) {
      await prisma.tenantUser.update({
        where: { id: existingMembership.id },
        data: { roleId: roleIds[demoUser.role], branchId },
      });
    } else {
      await prisma.tenantUser.create({
        data: { tenantId, userId: user.id, branchId, roleId: roleIds[demoUser.role] },
      });
    }
  }

  console.log(`Seeded ${DEMO_USERS.length} demo users (password: "${DEMO_PASSWORD}").`);
}

async function main(): Promise<void> {
  await seedPermissions();
  const roleIds = await seedRoles();
  const demoTenant = await seedDemoTenant();
  await seedDemoUsers(roleIds, demoTenant);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

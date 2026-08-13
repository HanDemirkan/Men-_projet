// Sprint 2 seed: real permissions, system roles, and a demo tenant with one
// user per role so the auth system can be exercised end to end. There are
// no tenant/branch/user CRUD endpoints yet (Sprint 2 scope is auth only),
// so this script is the only way this data gets created.
//
// This script is dev/demo-only - it creates a fake tenant and 7 fake users
// with a shared, publicly-documented password. It must never be the only
// way a real SUPER_ADMIN account gets created in production - see
// prisma/bootstrap-admin.ts (`pnpm bootstrap:admin`) for that.
import { ROLES } from "@qr-platform/permissions";
import type { Role } from "@qr-platform/permissions";
import * as argon2 from "argon2";

import { seedPermissions, seedRoles } from "../src/admin-bootstrap";
import { prisma } from "../src/client";

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
  console.log("Seeded permissions.");
  const roleIds = await seedRoles();
  console.log("Seeded system roles with their permissions.");
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

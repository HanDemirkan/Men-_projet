import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Prisma, prisma } from "@qr-platform/database";
import type { PermissionCode, Role } from "@qr-platform/permissions";

const MEMBERSHIP_INCLUDE = {
  role: { include: { rolePermissions: { include: { permission: true } } } },
} satisfies Prisma.TenantUserInclude;

type MembershipRow = Prisma.TenantUserGetPayload<{ include: typeof MEMBERSHIP_INCLUDE }>;

export interface MembershipContext {
  tenantUserId: string;
  tenantId: string | null;
  branchId: string | null;
  roleId: string;
  roleCode: Role;
  permissions: PermissionCode[];
}

// Resolves "who can this user act as" - the TenantUser -> Role ->
// Permission chain - using the raw (unscoped) `prisma` client. This is a
// deliberate, documented exception to the tenant-scoped client (see
// tenant-scoped-client.ts): identity resolution happens either before any
// tenant context exists (login) or *is* the step establishing it
// (AuthContextMiddleware), so it cannot itself depend on that context.
@Injectable()
export class IdentityService {
  // Login-time only: picks which tenant membership becomes this session's
  // context. Prefers a platform-level (tenantId null, e.g. SUPER_ADMIN)
  // membership; otherwise the earliest-created tenant membership. A user
  // with active memberships in more than one tenant cannot yet choose which
  // one to sign in as - see Sprint 2 delivery notes ("Bilinen Eksikler").
  async resolvePrimaryMembership(userId: string): Promise<MembershipContext> {
    const memberships = await prisma.tenantUser.findMany({
      where: { userId, status: "ACTIVE" },
      include: MEMBERSHIP_INCLUDE,
      orderBy: { createdAt: "asc" },
    });

    const platformMembership = memberships.find((membership) => membership.tenantId === null);
    const membership = platformMembership ?? memberships[0];

    if (!membership) {
      throw new UnauthorizedException("Kullanıcının aktif bir rol ataması bulunmuyor.");
    }

    return toMembershipContext(membership);
  }

  // Per-request: re-reads the SAME membership by id so authorization always
  // reflects the live role/permission state, never a cached JWT claim.
  async resolveMembershipById(tenantUserId: string): Promise<MembershipContext | null> {
    const membership = await prisma.tenantUser.findUnique({
      where: { id: tenantUserId },
      include: MEMBERSHIP_INCLUDE,
    });

    if (!membership || membership.status !== "ACTIVE") {
      return null;
    }

    return toMembershipContext(membership);
  }
}

function toMembershipContext(membership: MembershipRow): MembershipContext {
  return {
    tenantUserId: membership.id,
    tenantId: membership.tenantId,
    branchId: membership.branchId,
    roleId: membership.roleId,
    roleCode: membership.role.code as Role,
    permissions: membership.role.rolePermissions.map(
      (rolePermission) => rolePermission.permission.code as PermissionCode,
    ),
  };
}

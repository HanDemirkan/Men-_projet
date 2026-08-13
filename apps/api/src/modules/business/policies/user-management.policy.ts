import { ForbiddenException } from "@nestjs/common";
import { TenantUserStatus } from "@qr-platform/database";
import { ROLES } from "@qr-platform/permissions";
import type { Role } from "@qr-platform/permissions";

const BRANCH_MANAGER_ASSIGNABLE_ROLES: readonly Role[] = [
  ROLES.CASHIER,
  ROLES.WAITER,
  ROLES.KITCHEN,
  ROLES.MENU_EDITOR,
];

export interface RoleAssignmentContext {
  callerRoleCode: Role;
  targetRole: Role;
}

// TENANT_OWNER can assign any role, including another TENANT_OWNER.
// BRANCH_MANAGER can only staff their own branch with operational roles -
// never TENANT_OWNER or another BRANCH_MANAGER (that would let a branch
// manager promote themselves or a peer to tenant-wide control).
export function assertCanAssignRole(context: RoleAssignmentContext): void {
  if (context.callerRoleCode === ROLES.TENANT_OWNER) {
    return;
  }

  if (context.callerRoleCode === ROLES.BRANCH_MANAGER && !BRANCH_MANAGER_ASSIGNABLE_ROLES.includes(context.targetRole)) {
    throw new ForbiddenException("Bu rolü atama yetkiniz yok.");
  }
}

export interface BranchScopeContext {
  callerRoleCode: Role;
  callerBranchId: string | null;
  targetBranchId: string | null | undefined;
}

// BRANCH_MANAGER may only create/update/view staff pinned to their OWN
// branch - not tenant-wide (branchId null) staff, and not another branch's.
// TENANT_OWNER has no such restriction (tenant-wide by design).
export function assertWithinManagedBranch(context: BranchScopeContext): void {
  if (context.callerRoleCode !== ROLES.BRANCH_MANAGER) {
    return;
  }

  if (!context.callerBranchId || context.targetBranchId !== context.callerBranchId) {
    throw new ForbiddenException("Yalnızca kendi şubenize personel atayabilirsiniz.");
  }
}

export interface UserStatusChangeContext {
  targetUserId: string;
  callerUserId: string;
  newStatus: TenantUserStatus;
  isLastActiveTenantOwner: boolean;
}

// Same two-part self-protection idea as Sprint 4's admin policy, scoped to
// this tenant instead of the whole platform: can't deactivate yourself, and
// the tenant can never be left with zero active TENANT_OWNERs.
export function assertCanChangeUserStatus(context: UserStatusChangeContext): void {
  if (context.newStatus !== TenantUserStatus.INACTIVE) {
    return;
  }

  if (context.targetUserId === context.callerUserId) {
    throw new ForbiddenException("Kendi hesabınızı pasif hale getiremezsiniz.");
  }

  if (context.isLastActiveTenantOwner) {
    throw new ForbiddenException("İşletmenin son aktif sahibi (TENANT_OWNER) pasif hale getirilemez.");
  }
}

export interface SessionRevokeContext {
  targetUserId: string;
  callerUserId: string;
  callerSessionId: string;
  sessionIdToRevoke?: string;
}

// Identical reasoning to Sprint 4's session-revoke.policy.ts - revoking your
// own current session through this endpoint would end the very session
// performing the action.
export function assertCanRevokeSessions(context: SessionRevokeContext): void {
  if (context.targetUserId !== context.callerUserId) {
    return;
  }

  if (!context.sessionIdToRevoke || context.sessionIdToRevoke === context.callerSessionId) {
    throw new ForbiddenException("Kendi aktif oturumunuzu bu ekrandan sonlandıramazsınız - çıkış yapın.");
  }
}

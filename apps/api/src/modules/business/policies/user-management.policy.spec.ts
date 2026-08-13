import { ForbiddenException } from "@nestjs/common";
import { TenantUserStatus } from "@qr-platform/database";
import { ROLES } from "@qr-platform/permissions";

import {
  assertCanAssignRole,
  assertCanChangeUserStatus,
  assertCanRevokeSessions,
  assertWithinManagedBranch,
} from "./user-management.policy";

describe("assertCanAssignRole", () => {
  it("allows TENANT_OWNER to assign any role, including another TENANT_OWNER", () => {
    expect(() =>
      assertCanAssignRole({ callerRoleCode: ROLES.TENANT_OWNER, targetRole: ROLES.TENANT_OWNER }),
    ).not.toThrow();
  });

  it("allows BRANCH_MANAGER to assign an operational role", () => {
    expect(() =>
      assertCanAssignRole({ callerRoleCode: ROLES.BRANCH_MANAGER, targetRole: ROLES.WAITER }),
    ).not.toThrow();
  });

  it("blocks BRANCH_MANAGER from assigning TENANT_OWNER", () => {
    expect(() =>
      assertCanAssignRole({ callerRoleCode: ROLES.BRANCH_MANAGER, targetRole: ROLES.TENANT_OWNER }),
    ).toThrow(ForbiddenException);
  });

  it("blocks BRANCH_MANAGER from assigning another BRANCH_MANAGER", () => {
    expect(() =>
      assertCanAssignRole({ callerRoleCode: ROLES.BRANCH_MANAGER, targetRole: ROLES.BRANCH_MANAGER }),
    ).toThrow(ForbiddenException);
  });
});

describe("assertWithinManagedBranch", () => {
  it("does not restrict TENANT_OWNER to any branch", () => {
    expect(() =>
      assertWithinManagedBranch({
        callerRoleCode: ROLES.TENANT_OWNER,
        callerBranchId: null,
        targetBranchId: "branch-other",
      }),
    ).not.toThrow();
  });

  it("allows BRANCH_MANAGER to target their own branch", () => {
    expect(() =>
      assertWithinManagedBranch({
        callerRoleCode: ROLES.BRANCH_MANAGER,
        callerBranchId: "branch-1",
        targetBranchId: "branch-1",
      }),
    ).not.toThrow();
  });

  it("blocks BRANCH_MANAGER from targeting a different branch", () => {
    expect(() =>
      assertWithinManagedBranch({
        callerRoleCode: ROLES.BRANCH_MANAGER,
        callerBranchId: "branch-1",
        targetBranchId: "branch-2",
      }),
    ).toThrow(ForbiddenException);
  });

  it("blocks BRANCH_MANAGER from targeting tenant-wide (null) staff", () => {
    expect(() =>
      assertWithinManagedBranch({
        callerRoleCode: ROLES.BRANCH_MANAGER,
        callerBranchId: "branch-1",
        targetBranchId: null,
      }),
    ).toThrow(ForbiddenException);
  });
});

describe("assertCanChangeUserStatus", () => {
  it("allows activating anyone, including yourself", () => {
    expect(() =>
      assertCanChangeUserStatus({
        targetUserId: "user-1",
        callerUserId: "user-1",
        newStatus: TenantUserStatus.ACTIVE,
        isLastActiveTenantOwner: true,
      }),
    ).not.toThrow();
  });

  it("blocks deactivating your own account", () => {
    expect(() =>
      assertCanChangeUserStatus({
        targetUserId: "user-1",
        callerUserId: "user-1",
        newStatus: TenantUserStatus.INACTIVE,
        isLastActiveTenantOwner: false,
      }),
    ).toThrow(ForbiddenException);
  });

  it("blocks deactivating the tenant's last active TENANT_OWNER", () => {
    expect(() =>
      assertCanChangeUserStatus({
        targetUserId: "user-2",
        callerUserId: "user-1",
        newStatus: TenantUserStatus.INACTIVE,
        isLastActiveTenantOwner: true,
      }),
    ).toThrow(ForbiddenException);
  });

  it("allows deactivating someone else who isn't the last TENANT_OWNER", () => {
    expect(() =>
      assertCanChangeUserStatus({
        targetUserId: "user-2",
        callerUserId: "user-1",
        newStatus: TenantUserStatus.INACTIVE,
        isLastActiveTenantOwner: false,
      }),
    ).not.toThrow();
  });
});

describe("assertCanRevokeSessions", () => {
  it("allows revoking another user's sessions freely", () => {
    expect(() =>
      assertCanRevokeSessions({ targetUserId: "user-2", callerUserId: "user-1", callerSessionId: "session-1" }),
    ).not.toThrow();
  });

  it("blocks revoking ALL of your own sessions (would include the current one)", () => {
    expect(() =>
      assertCanRevokeSessions({ targetUserId: "user-1", callerUserId: "user-1", callerSessionId: "session-1" }),
    ).toThrow(ForbiddenException);
  });

  it("blocks revoking your own current session specifically", () => {
    expect(() =>
      assertCanRevokeSessions({
        targetUserId: "user-1",
        callerUserId: "user-1",
        callerSessionId: "session-1",
        sessionIdToRevoke: "session-1",
      }),
    ).toThrow(ForbiddenException);
  });

  it("allows revoking a DIFFERENT one of your own sessions (another device)", () => {
    expect(() =>
      assertCanRevokeSessions({
        targetUserId: "user-1",
        callerUserId: "user-1",
        callerSessionId: "session-1",
        sessionIdToRevoke: "session-2",
      }),
    ).not.toThrow();
  });
});

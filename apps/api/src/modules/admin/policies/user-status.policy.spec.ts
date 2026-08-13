import { ForbiddenException } from "@nestjs/common";
import { UserStatus } from "@qr-platform/database";

import { assertCanChangeUserStatus } from "./user-status.policy";

describe("assertCanChangeUserStatus", () => {
  it("allows activating anyone, including yourself", () => {
    expect(() =>
      assertCanChangeUserStatus({
        targetUserId: "user-1",
        callerUserId: "user-1",
        newStatus: UserStatus.ACTIVE,
        isLastActiveSuperAdmin: true,
      }),
    ).not.toThrow();
  });

  it("blocks deactivating your own account", () => {
    expect(() =>
      assertCanChangeUserStatus({
        targetUserId: "user-1",
        callerUserId: "user-1",
        newStatus: UserStatus.INACTIVE,
        isLastActiveSuperAdmin: false,
      }),
    ).toThrow(ForbiddenException);
  });

  it("blocks deactivating the last active SUPER_ADMIN", () => {
    expect(() =>
      assertCanChangeUserStatus({
        targetUserId: "user-2",
        callerUserId: "user-1",
        newStatus: UserStatus.INACTIVE,
        isLastActiveSuperAdmin: true,
      }),
    ).toThrow(ForbiddenException);
  });

  it("allows deactivating someone else who isn't the last SUPER_ADMIN", () => {
    expect(() =>
      assertCanChangeUserStatus({
        targetUserId: "user-2",
        callerUserId: "user-1",
        newStatus: UserStatus.INACTIVE,
        isLastActiveSuperAdmin: false,
      }),
    ).not.toThrow();
  });
});

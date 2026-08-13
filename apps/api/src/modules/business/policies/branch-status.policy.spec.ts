import { ForbiddenException } from "@nestjs/common";
import { BranchStatus } from "@qr-platform/database";

import { assertCanChangeBranchStatus } from "./branch-status.policy";

describe("assertCanChangeBranchStatus", () => {
  it("allows activating a branch regardless of how many are active", () => {
    expect(() =>
      assertCanChangeBranchStatus({ newStatus: BranchStatus.ACTIVE, isLastActiveBranch: true }),
    ).not.toThrow();
  });

  it("blocks deactivating the last active branch", () => {
    expect(() =>
      assertCanChangeBranchStatus({ newStatus: BranchStatus.INACTIVE, isLastActiveBranch: true }),
    ).toThrow(ForbiddenException);
  });

  it("allows deactivating a branch when another active branch remains", () => {
    expect(() =>
      assertCanChangeBranchStatus({ newStatus: BranchStatus.INACTIVE, isLastActiveBranch: false }),
    ).not.toThrow();
  });
});

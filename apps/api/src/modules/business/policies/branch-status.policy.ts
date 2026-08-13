import { ForbiddenException } from "@nestjs/common";
import { BranchStatus } from "@qr-platform/database";

export interface BranchStatusChangeContext {
  newStatus: BranchStatus;
  isLastActiveBranch: boolean;
}

// A tenant with zero active branches has nowhere for its staff/QR/storefront
// to point - this is the same class of "can't reach zero" protection as
// Sprint 4's last-SUPER_ADMIN rule, just for branches instead of accounts.
export function assertCanChangeBranchStatus(context: BranchStatusChangeContext): void {
  if (context.newStatus !== BranchStatus.INACTIVE) {
    return;
  }

  if (context.isLastActiveBranch) {
    throw new ForbiddenException("İşletmenin son aktif şubesi pasif hale getirilemez.");
  }
}

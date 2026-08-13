import { ForbiddenException } from "@nestjs/common";
import { UserStatus } from "@qr-platform/database";

export interface UserStatusChangeContext {
  targetUserId: string;
  callerUserId: string;
  newStatus: UserStatus;
  isLastActiveSuperAdmin: boolean;
}

// Two self-protection rules an admin panel needs regardless of who's using
// it: a SUPER_ADMIN can't lock themselves out, and the platform can never be
// left with zero active SUPER_ADMIN accounts - both are otherwise
// unrecoverable without direct database access.
export function assertCanChangeUserStatus(context: UserStatusChangeContext): void {
  if (context.newStatus !== UserStatus.INACTIVE) {
    return;
  }

  if (context.targetUserId === context.callerUserId) {
    throw new ForbiddenException("Kendi hesabınızı pasif hale getiremezsiniz.");
  }

  if (context.isLastActiveSuperAdmin) {
    throw new ForbiddenException("Platformdaki son aktif Süper Admin hesabı pasif hale getirilemez.");
  }
}

import { ForbiddenException } from "@nestjs/common";

export interface SessionRevokeContext {
  targetUserId: string;
  callerUserId: string;
  callerSessionId: string;
  sessionIdToRevoke?: string;
}

// Revoking every session for the CALLER's own account through this endpoint
// (or explicitly revoking the session currently making the request) would
// silently end the very session performing the action - forcing that case
// through a normal logout instead avoids self-lockout mid-operation.
export function assertCanRevokeSessions(context: SessionRevokeContext): void {
  if (context.targetUserId !== context.callerUserId) {
    return;
  }

  if (!context.sessionIdToRevoke || context.sessionIdToRevoke === context.callerSessionId) {
    throw new ForbiddenException("Kendi aktif oturumunuzu bu ekrandan sonlandıramazsınız - çıkış yapın.");
  }
}

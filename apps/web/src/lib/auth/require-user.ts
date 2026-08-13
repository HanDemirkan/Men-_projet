import type { Role } from "@qr-platform/permissions";
import type { ApiResponse } from "@qr-platform/shared";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { ROUTES } from "@/config/routes";
import { getServerApiUrl } from "@/lib/env";
import type { AuthUser } from "@/types/auth";

// The actual GET /auth/me call, wrapped in React's per-request `cache()` -
// a route's shared layout AND its leaf page both commonly need the resolved
// user (the layout for nav/role, the page for its own permission checks),
// and previously each called requireUser() independently, doubling this
// fetch on nearly every business-panel page load (Sprint 8 diagnosis).
// `cache()` memoizes by argument identity, and this function deliberately
// takes none - splitting it out from requireUser() (whose `allowedRoles`
// argument differs per call site and would defeat that memoization) is what
// makes every caller within one request collapse onto a single real fetch,
// same-request only, cleared automatically for the next request.
const fetchCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const cookieHeader = cookies().toString();

  // A network-level failure here (API restarting, transient connection
  // reset) must not crash every protected page with an unhandled exception -
  // treat it the same as "not authenticated" and let requireUser()'s
  // existing redirect-to-login handle it.
  let response: Response;
  try {
    response = await fetch(`${getServerApiUrl()}/auth/me`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
  } catch {
    return null;
  }

  const body = (await response.json().catch(() => null)) as ApiResponse<AuthUser> | null;

  return body && body.success ? body.data : null;
});

// Server Component guard: resolves identity/role/permissions fresh from the
// *backend* (never trusts a client-supplied role). This is a UX-layer
// convenience (fast redirect, no flash of protected content); the real
// security boundary is always the backend guards (JwtAuthGuard/
// PermissionsGuard/TenantGuard), which apply independently of this check.
export async function requireUser(allowedRoles: readonly Role[]): Promise<AuthUser> {
  const user = await fetchCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  if (!allowedRoles.includes(user.role)) {
    redirect(ROUTES.forbidden);
  }

  return user;
}

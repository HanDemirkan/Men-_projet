import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge-level cheap pre-check only: redirects to /login when the access
// token cookie is entirely absent, so a signed-out user never even reaches
// a panel's Server Component before bouncing. It is NOT the security
// boundary - a present-but-expired/invalid cookie still passes here and is
// caught by requireUser() (which asks the backend) and by the backend
// guards themselves, which is where authorization is actually enforced.
const PROTECTED_PREFIXES = ["/admin", "/business", "/cashier", "/kitchen", "/waiter"];
const ACCESS_TOKEN_COOKIE = "access_token";

export function middleware(request: NextRequest): NextResponse {
  const isProtected = PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (isProtected && !request.cookies.has(ACCESS_TOKEN_COOKIE)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/business/:path*", "/cashier/:path*", "/kitchen/:path*", "/waiter/:path*"],
};

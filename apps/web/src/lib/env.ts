// Sprint 0: this is the single place in the web app that reads
// `process.env` directly. Everything else consumes `getApiUrl()`/
// `getServerApiUrl()`.
//
// `NEXT_PUBLIC_*` vars get inlined into the browser bundle, so this is the
// URL a phone (or any other device) actually reaches over the network - in
// development it must be the machine's LAN IP, not "localhost" (a phone
// can't resolve that back to the dev machine). See Sprint 6.
export function getApiUrl(): string {
  const apiUrl = process.env["NEXT_PUBLIC_API_URL"];

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return apiUrl;
}

// Server-only counterpart to getApiUrl(): Server Components/Route Handlers
// run inside the same Next.js Node process as the dev machine itself, so
// they can (and should) call the API over localhost - faster and immune to
// the LAN briefly dropping, unlike a phone's browser which has no choice but
// to go over the network. Falls back to NEXT_PUBLIC_API_URL if API_SERVER_URL
// isn't set (e.g. production, where both are typically the same origin
// anyway) so this never throws in an environment that only configured the
// one var. See Sprint 6.
export function getServerApiUrl(): string {
  return process.env["API_SERVER_URL"] ?? getApiUrl();
}

// Development-only convenience so the login form can pre-fill the fixed dev
// super admin account (see apps/api's DevelopmentBootstrapService). Gated on
// BOTH the NEXT_PUBLIC_DEV_ADMIN_* values being present AND NODE_ENV being
// "development" - defense in depth on top of these vars only ever being set
// in .env.development (never .env.production*), so a real production build
// has nothing to inline here even if this check were somehow bypassed.
export function getDevAdminCredentials(): { email: string; password: string } | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const email = process.env["NEXT_PUBLIC_DEV_ADMIN_EMAIL"];
  const password = process.env["NEXT_PUBLIC_DEV_ADMIN_PASSWORD"];

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

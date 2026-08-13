import type { ApiResponse } from "@qr-platform/shared";
import { cookies } from "next/headers";

import { getServerApiUrl } from "./env";

// Server Component data-fetch helper: `apiFetch` (lib/api-client.ts) can't
// be used here because the browser's cookies aren't automatically available
// to a Server Component's own `fetch` calls - the incoming request's cookie
// header has to be forwarded manually, same as `requireUser()` does.
// Returns `null` on any failure (auth, network, 404) - callers that need to
// distinguish those cases should call the API directly instead.
export async function serverFetch<TData>(path: string, init?: RequestInit): Promise<TData | null> {
  const cookieHeader = cookies().toString();

  const response = await fetch(`${getServerApiUrl()}${path}`, {
    ...init,
    headers: { ...(cookieHeader ? { cookie: cookieHeader } : {}), ...init?.headers },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as ApiResponse<TData> | null;

  if (!body || !body.success) {
    return null;
  }

  return body.data;
}

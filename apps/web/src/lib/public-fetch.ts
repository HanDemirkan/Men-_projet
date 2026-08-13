import type { ApiResponse } from "@qr-platform/shared";

import { getServerApiUrl } from "./env";

// Public storefront counterpart to serverFetch(): no cookies to forward (the
// storefront routes are anonymous by design - see ADR 0009), and pages using
// it want to distinguish "not found" from other failures to call Next's
// notFound(), so this returns a discriminated result instead of collapsing
// every failure to `null`.
//
// "redirect" (QR permanence): PublicStorefrontContextMiddleware's 404 body
// carries a `redirectSlug` when the requested slug is stale but has a live
// TenantSlugAlias - callers should 308-redirect to that slug (via
// `permanentRedirect`) instead of rendering notFound(), so a QR code printed
// before a rename keeps resolving forever.
export type PublicFetchResult<TData> =
  | { status: "success"; data: TData }
  | { status: "redirect"; targetSlug: string }
  | { status: "not-found" | "error" };

// Appends the original request's query string (e.g. `?src=qr`, set by the
// printed QR itself) onto a redirect target, so a scan-attributed visit
// still reads as scan-attributed after the slug-alias 308 - otherwise the
// business dashboard's "QR görüntülenme sayısı" would silently undercount
// every scan of a renamed storefront's still-printed code.
export function withSearch(path: string, searchParams: Record<string, string | string[] | undefined>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      query.set(key, value);
    }
  }

  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function publicFetch<TData>(path: string): Promise<PublicFetchResult<TData>> {
  const response = await fetch(`${getServerApiUrl()}${path}`, { cache: "no-store" });

  if (response.status === 404) {
    const body = (await response.json().catch(() => null)) as ApiResponse<TData> | null;
    const redirectSlug = body && !body.success ? body.error.redirectSlug : null;

    return redirectSlug ? { status: "redirect", targetSlug: redirectSlug } : { status: "not-found" };
  }

  const body = (await response.json().catch(() => null)) as ApiResponse<TData> | null;

  if (!body || !body.success) {
    return { status: "error" };
  }

  return { status: "success", data: body.data };
}

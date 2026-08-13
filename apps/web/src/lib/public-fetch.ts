import type { ApiResponse } from "@qr-platform/shared";

import { getServerApiUrl } from "./env";

export type PublicFetchResult<TData> =
  | { status: "success"; data: TData }
  | { status: "redirect"; targetSlug: string }
  | { status: "not-found" | "error" };

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
  let response: Response;

  try {
    response = await fetch(`${getServerApiUrl()}${path}`, { cache: "no-store" });
  } catch {
    return { status: "error" };
  }

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

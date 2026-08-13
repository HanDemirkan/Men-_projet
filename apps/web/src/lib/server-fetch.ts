import type { ApiResponse } from "@qr-platform/shared";
import { cookies } from "next/headers";
import { cache } from "react";

import { getServerApiUrl } from "./env";

async function fetchServerData<TData>(path: string): Promise<TData | null> {
  const cookieHeader = cookies().toString();

  try {
    const response = await fetch(`${getServerApiUrl()}${path}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });

    const body = (await response.json().catch(() => null)) as ApiResponse<TData> | null;
    return body && body.success ? body.data : null;
  } catch {
    return null;
  }
}

// GET reads are memoized for the lifetime of a single Server Component render.
// Several layouts/pages ask for the same resource during one navigation; without
// this cache they generate duplicate API round-trips and make panel navigation
// feel slower than the actual backend response time.
const cachedServerGet = cache(async <TData>(path: string): Promise<TData | null> => fetchServerData<TData>(path));

export async function serverFetch<TData>(path: string, init?: RequestInit): Promise<TData | null> {
  const method = (init?.method ?? "GET").toUpperCase();
  const hasCustomRequest = Boolean(init && (init.body || init.headers || method !== "GET"));

  if (!hasCustomRequest) {
    return cachedServerGet<TData>(path);
  }

  const cookieHeader = cookies().toString();
  try {
    const response = await fetch(`${getServerApiUrl()}${path}`, {
      ...init,
      headers: { ...(cookieHeader ? { cookie: cookieHeader } : {}), ...init?.headers },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as ApiResponse<TData> | null;
    return body && body.success ? body.data : null;
  } catch {
    return null;
  }
}

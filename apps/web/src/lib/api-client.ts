import type { ApiResponse, HealthStatus } from "@qr-platform/shared";

import { getApiUrl } from "./env";

export type FetchResult<TData> =
  { status: "success"; data: TData } | { status: "error"; message: string };

const GENERIC_ERROR_MESSAGE = "Sunucuya şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyin.";

// Shared fetch wrapper for every API call the web app makes. Always sends
// cookies (auth is cookie-based, not header-based) and always parses the
// backend's {success, data|error} envelope - including on 4xx/5xx, since
// AllExceptionsFilter returns a real JSON body with a user-facing `message`
// on error, not just a status code.
export async function apiFetch<TData>(path: string, init?: RequestInit): Promise<FetchResult<TData>> {
  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });

    const body = (await response.json()) as ApiResponse<TData>;

    if (!body.success) {
      return { status: "error", message: body.error.message };
    }

    return { status: "success", data: body.data };
  } catch {
    // Never surface the raw network/parse error (stack trace) to the user.
    return { status: "error", message: GENERIC_ERROR_MESSAGE };
  }
}

export async function fetchHealth(): Promise<FetchResult<HealthStatus>> {
  return apiFetch<HealthStatus>("/health");
}

// Separate from `apiFetch`: a FormData body must NOT get a `Content-Type`
// header set manually - the browser sets `multipart/form-data; boundary=...`
// itself when it serializes the FormData, and a hardcoded
// `application/json` (or any manual value) would break multipart parsing.
export async function apiUpload<TData>(path: string, formData: FormData): Promise<FetchResult<TData>> {
  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      body: formData,
    });

    const body = (await response.json()) as ApiResponse<TData>;

    if (!body.success) {
      return { status: "error", message: body.error.message };
    }

    return { status: "success", data: body.data };
  } catch {
    return { status: "error", message: GENERIC_ERROR_MESSAGE };
  }
}

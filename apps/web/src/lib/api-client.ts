import type { ApiResponse, HealthStatus } from "@qr-platform/shared";

import { getApiUrl } from "./env";

export type FetchResult<TData> =
  { status: "success"; data: TData } | { status: "error"; message: string };

const GENERIC_ERROR_MESSAGE = "Sunucuya şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyin.";

export async function fetchHealth(): Promise<FetchResult<HealthStatus>> {
  try {
    const response = await fetch(`${getApiUrl()}/health`, { cache: "no-store" });

    if (!response.ok) {
      return { status: "error", message: GENERIC_ERROR_MESSAGE };
    }

    const body = (await response.json()) as ApiResponse<HealthStatus>;

    if (!body.success) {
      return { status: "error", message: GENERIC_ERROR_MESSAGE };
    }

    return { status: "success", data: body.data };
  } catch {
    // Never surface the raw network/parse error (stack trace) to the user.
    return { status: "error", message: GENERIC_ERROR_MESSAGE };
  }
}

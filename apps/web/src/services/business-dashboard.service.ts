import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import type { BusinessDashboard } from "@/types/business";

export function getBusinessDashboard(): Promise<FetchResult<BusinessDashboard>> {
  return apiFetch<BusinessDashboard>("/business/dashboard");
}

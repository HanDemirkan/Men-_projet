import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import type { AdminDashboard } from "@/types/admin";

export function getAdminDashboard(): Promise<FetchResult<AdminDashboard>> {
  return apiFetch<AdminDashboard>("/admin/dashboard");
}

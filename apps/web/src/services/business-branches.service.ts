import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import { buildQueryString } from "@/lib/query-string";
import type {
  BusinessBranch,
  CreateBranchInput,
  ListBranchesParams,
  PaginatedResult,
  UpdateBranchInput,
} from "@/types/business";

export function listBranches(
  params: ListBranchesParams = {},
): Promise<FetchResult<PaginatedResult<BusinessBranch>>> {
  return apiFetch<PaginatedResult<BusinessBranch>>(`/business/branches${buildQueryString(params)}`);
}

export function getBranch(id: string): Promise<FetchResult<BusinessBranch>> {
  return apiFetch<BusinessBranch>(`/business/branches/${id}`);
}

export function createBranch(input: CreateBranchInput): Promise<FetchResult<BusinessBranch>> {
  return apiFetch<BusinessBranch>("/business/branches", { method: "POST", body: JSON.stringify(input) });
}

export function updateBranch(id: string, input: UpdateBranchInput): Promise<FetchResult<BusinessBranch>> {
  return apiFetch<BusinessBranch>(`/business/branches/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

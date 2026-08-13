import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import type { BusinessProfile } from "@/types/catalog";

export function getBusinessProfile(): Promise<FetchResult<BusinessProfile>> {
  return apiFetch<BusinessProfile>("/business/profile");
}

export type UpdateBusinessProfileInput = Partial<
  Omit<BusinessProfile, "id" | "slug" | "status"> & { slug: string; name: string }
>;

export function updateBusinessProfile(
  input: UpdateBusinessProfileInput,
): Promise<FetchResult<BusinessProfile>> {
  return apiFetch<BusinessProfile>("/business/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

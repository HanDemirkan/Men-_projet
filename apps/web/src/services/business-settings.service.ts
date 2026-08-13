import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import type { BusinessSettings, UpdateSettingsInput } from "@/types/business";

export function getBusinessSettings(): Promise<FetchResult<BusinessSettings>> {
  return apiFetch<BusinessSettings>("/business/settings");
}

export function updateBusinessSettings(input: UpdateSettingsInput): Promise<FetchResult<BusinessSettings>> {
  return apiFetch<BusinessSettings>("/business/settings", { method: "PATCH", body: JSON.stringify(input) });
}

import type { StorefrontConfig, TemplateCode } from "@qr-platform/shared";

import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";

export interface StorefrontConfigState {
  templateCode: TemplateCode;
  published: StorefrontConfig;
  draft: StorefrontConfig;
  hasUnpublishedChanges: boolean;
  publishedAt: string | null;
}

export interface UpdateStorefrontConfigDraftResult {
  templateCode: TemplateCode;
  config: StorefrontConfig;
}

export interface PublishStorefrontConfigResult {
  config: StorefrontConfig;
  publishedAt: string | null;
}

export interface RevertStorefrontConfigResult {
  templateCode: TemplateCode;
  config: StorefrontConfig;
  publishedAt: string | null;
}

export function getStorefrontConfig(): Promise<FetchResult<StorefrontConfigState>> {
  return apiFetch<StorefrontConfigState>("/storefront-config");
}

export function updateStorefrontConfigDraft(
  templateCode: TemplateCode,
  input: Partial<StorefrontConfig>,
): Promise<FetchResult<UpdateStorefrontConfigDraftResult>> {
  return apiFetch<UpdateStorefrontConfigDraftResult>("/storefront-config/draft", {
    method: "PATCH",
    body: JSON.stringify({ ...input, templateCode }),
  });
}

export function publishStorefrontConfig(): Promise<FetchResult<PublishStorefrontConfigResult>> {
  return apiFetch<PublishStorefrontConfigResult>("/storefront-config/publish", { method: "POST" });
}

// Spec §13: re-publishes the previous revision. Requires at least 2
// published revisions to exist server-side.
export function revertStorefrontConfig(): Promise<FetchResult<RevertStorefrontConfigResult>> {
  return apiFetch<RevertStorefrontConfigResult>("/storefront-config/revert", { method: "POST" });
}

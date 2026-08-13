import { apiFetch, apiUpload } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import { getApiUrl } from "@/lib/env";
import type { Media, MediaType } from "@/types/catalog";

export function uploadMedia(file: File, type: MediaType): Promise<FetchResult<Media>> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  return apiUpload<Media>("/media", formData);
}

export function listMedia(): Promise<FetchResult<Media[]>> {
  return apiFetch<Media[]>("/media");
}

export function deleteMedia(id: string): Promise<FetchResult<{ deleted: true }>> {
  return apiFetch<{ deleted: true }>(`/media/${id}`, { method: "DELETE" });
}

export function mediaFileUrl(id: string): string {
  return `${getApiUrl()}/media/${id}/file`;
}

export function mediaThumbnailUrl(id: string): string {
  return `${getApiUrl()}/media/${id}/thumbnail`;
}

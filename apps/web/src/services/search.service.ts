import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";

export type SearchResultType = "product" | "category" | "variant" | "option";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  name: string;
  breadcrumb: string;
  categoryId: string;
}

export function search(query: string): Promise<FetchResult<SearchResult[]>> {
  return apiFetch<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`);
}

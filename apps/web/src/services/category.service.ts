import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import type { Category, ReorderItem } from "@/types/catalog";

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  imageId?: string;
  sortOrder?: number;
  active?: boolean;
}

export function listCategoriesByMenu(menuId: string): Promise<FetchResult<Category[]>> {
  return apiFetch<Category[]>(`/menus/${menuId}/categories`);
}

export function getCategory(id: string): Promise<FetchResult<Category>> {
  return apiFetch<Category>(`/categories/${id}`);
}

export function createCategory(menuId: string, input: CategoryInput): Promise<FetchResult<Category>> {
  return apiFetch<Category>(`/menus/${menuId}/categories`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCategory(id: string, input: Partial<CategoryInput>): Promise<FetchResult<Category>> {
  return apiFetch<Category>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteCategory(id: string): Promise<FetchResult<{ deleted: true }>> {
  return apiFetch<{ deleted: true }>(`/categories/${id}`, { method: "DELETE" });
}

export function reorderCategories(items: ReorderItem[]): Promise<FetchResult<{ reordered: true }>> {
  return apiFetch<{ reordered: true }>("/categories/reorder", {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
}

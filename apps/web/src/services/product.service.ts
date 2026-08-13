import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import type { OptionGroup, Product, ProductOption, ReorderItem, Variant } from "@/types/catalog";

export interface ProductInput {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  price: number;
  imageId?: string;
  preparationTime?: number;
  calories?: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
}

export type ProductListStatus = "active" | "archived" | "all";

export function listProductsByCategory(
  categoryId: string,
  status: ProductListStatus = "active",
): Promise<FetchResult<Product[]>> {
  return apiFetch<Product[]>(`/categories/${categoryId}/products?status=${status}`);
}

export function getProduct(id: string): Promise<FetchResult<Product>> {
  return apiFetch<Product>(`/products/${id}`);
}

export function createProduct(categoryId: string, input: ProductInput): Promise<FetchResult<Product>> {
  return apiFetch<Product>(`/categories/${categoryId}/products`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProduct(id: string, input: Partial<ProductInput>): Promise<FetchResult<Product>> {
  return apiFetch<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteProduct(id: string): Promise<FetchResult<{ deleted: true }>> {
  return apiFetch<{ deleted: true }>(`/products/${id}`, { method: "DELETE" });
}

export function reorderProducts(items: ReorderItem[]): Promise<FetchResult<{ reordered: true }>> {
  return apiFetch<{ reordered: true }>("/products/reorder", {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
}

export function restoreProduct(id: string): Promise<FetchResult<Product>> {
  return apiFetch<Product>(`/products/${id}/restore`, { method: "PATCH" });
}

export function duplicateProduct(id: string): Promise<FetchResult<Product>> {
  return apiFetch<Product>(`/products/${id}/duplicate`, { method: "POST" });
}

export interface BulkUpdateProductsInput {
  ids: string[];
  data: { isAvailable?: boolean; isFeatured?: boolean; archived?: boolean };
}

export function bulkUpdateProducts(
  input: BulkUpdateProductsInput,
): Promise<FetchResult<{ updated: number }>> {
  return apiFetch<{ updated: number }>("/products/bulk", { method: "PATCH", body: JSON.stringify(input) });
}

export interface VariantInput {
  name: string;
  price: number;
  sortOrder?: number;
}

export function createVariant(productId: string, input: VariantInput): Promise<FetchResult<Variant>> {
  return apiFetch<Variant>(`/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateVariant(id: string, input: Partial<VariantInput>): Promise<FetchResult<Variant>> {
  return apiFetch<Variant>(`/variants/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteVariant(id: string): Promise<FetchResult<{ deleted: true }>> {
  return apiFetch<{ deleted: true }>(`/variants/${id}`, { method: "DELETE" });
}

export function reorderVariants(items: ReorderItem[]): Promise<FetchResult<{ reordered: true }>> {
  return apiFetch<{ reordered: true }>("/variants/reorder", { method: "PATCH", body: JSON.stringify({ items }) });
}

export interface OptionGroupInput {
  name: string;
  required?: boolean;
  multiple?: boolean;
  minimum?: number;
  maximum?: number;
  sortOrder?: number;
}

export function createOptionGroup(
  productId: string,
  input: OptionGroupInput,
): Promise<FetchResult<OptionGroup>> {
  return apiFetch<OptionGroup>(`/products/${productId}/option-groups`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOptionGroup(
  id: string,
  input: Partial<OptionGroupInput>,
): Promise<FetchResult<OptionGroup>> {
  return apiFetch<OptionGroup>(`/option-groups/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteOptionGroup(id: string): Promise<FetchResult<{ deleted: true }>> {
  return apiFetch<{ deleted: true }>(`/option-groups/${id}`, { method: "DELETE" });
}

export function reorderOptionGroups(items: ReorderItem[]): Promise<FetchResult<{ reordered: true }>> {
  return apiFetch<{ reordered: true }>("/option-groups/reorder", {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
}

export interface OptionInput {
  name: string;
  price?: number;
  sortOrder?: number;
  available?: boolean;
}

export function createOption(
  optionGroupId: string,
  input: OptionInput,
): Promise<FetchResult<ProductOption>> {
  return apiFetch<ProductOption>(`/option-groups/${optionGroupId}/options`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOption(id: string, input: Partial<OptionInput>): Promise<FetchResult<ProductOption>> {
  return apiFetch<ProductOption>(`/options/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteOption(id: string): Promise<FetchResult<{ deleted: true }>> {
  return apiFetch<{ deleted: true }>(`/options/${id}`, { method: "DELETE" });
}

export function reorderOptions(items: ReorderItem[]): Promise<FetchResult<{ reordered: true }>> {
  return apiFetch<{ reordered: true }>("/options/reorder", { method: "PATCH", body: JSON.stringify({ items }) });
}

import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import type { Menu, MenuStatus } from "@/types/catalog";

export interface MenuInput {
  name: string;
  description?: string;
  status?: MenuStatus;
  sortOrder?: number;
  activeFrom?: string;
  activeUntil?: string;
}

export function listMenus(): Promise<FetchResult<Menu[]>> {
  return apiFetch<Menu[]>("/menus");
}

export function getMenu(id: string): Promise<FetchResult<Menu>> {
  return apiFetch<Menu>(`/menus/${id}`);
}

export function createMenu(input: MenuInput): Promise<FetchResult<Menu>> {
  return apiFetch<Menu>("/menus", { method: "POST", body: JSON.stringify(input) });
}

export function updateMenu(id: string, input: Partial<MenuInput>): Promise<FetchResult<Menu>> {
  return apiFetch<Menu>(`/menus/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteMenu(id: string): Promise<FetchResult<{ deleted: true }>> {
  return apiFetch<{ deleted: true }>(`/menus/${id}`, { method: "DELETE" });
}

"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qr-platform/ui";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/config/routes";
import type { Menu } from "@/types/catalog";

export interface MenuSelectorProps {
  menus: Menu[];
  selectedMenuId?: string;
}

export function MenuSelector({ menus, selectedMenuId }: MenuSelectorProps) {
  const router = useRouter();

  if (menus.length === 0) {
    return null;
  }

  return (
    <div className="flex max-w-xs flex-col gap-2">
      <span className="text-sm font-medium text-foreground">Menü</span>
      <Select
        value={selectedMenuId}
        onValueChange={(value) => router.push(`${ROUTES.businessCategories}?menuId=${value}`)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Bir menü seçin" />
        </SelectTrigger>
        <SelectContent>
          {menus.map((menu) => (
            <SelectItem key={menu.id} value={menu.id}>
              {menu.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

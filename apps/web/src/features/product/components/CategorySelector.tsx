"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qr-platform/ui";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/config/routes";

export interface CategorySelectorProps {
  categories: Array<{ id: string; name: string; menuName: string }>;
  selectedCategoryId?: string;
}

export function CategorySelector({ categories, selectedCategoryId }: CategorySelectorProps) {
  const router = useRouter();

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="flex max-w-xs flex-col gap-2">
      <span className="text-sm font-medium text-foreground">Kategori</span>
      <Select
        value={selectedCategoryId}
        onValueChange={(value) => router.push(`${ROUTES.businessProducts}?categoryId=${value}`)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Bir kategori seçin" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.menuName} / {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

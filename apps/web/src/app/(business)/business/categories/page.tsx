import { EmptyState, PageHeader } from "@qr-platform/ui";
import { ListTree } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/config/routes";
import { CategoryList } from "@/features/category/components/CategoryList";
import { MenuSelector } from "@/features/category/components/MenuSelector";
import { serverFetch } from "@/lib/server-fetch";
import type { Category, Menu } from "@/types/catalog";

export const metadata: Metadata = {
  title: "Kategoriler — QR Platform",
};

export interface BusinessCategoriesPageProps {
  searchParams: { menuId?: string };
}

export default async function BusinessCategoriesPage({ searchParams }: BusinessCategoriesPageProps) {
  const menus = (await serverFetch<Menu[]>("/menus")) ?? [];
  const menuId = searchParams.menuId;
  const categories = menuId ? await serverFetch<Category[]>(`/menus/${menuId}/categories`) : null;
  const selectedMenu = menus.find((menu) => menu.id === menuId);

  return (
    <>
      <PageHeader title="Kategoriler" subtitle="Menülerinizin kategori yapısını oluşturun." />
      <MenuSelector menus={menus} selectedMenuId={menuId} />

      {!menuId ? (
        <EmptyState
          icon={ListTree}
          title="Bir menü seçin"
          description="Kategorileri yönetmek için yukarıdan bir menü seçin."
        />
      ) : !selectedMenu || categories === null ? (
        <EmptyState
          icon={ListTree}
          title="Menü bulunamadı"
          description="Seçilen menü mevcut değil ya da erişiminiz yok."
          action={
            <Link href={ROUTES.businessMenus} className="text-sm font-medium text-primary hover:underline">
              Menülere dön
            </Link>
          }
        />
      ) : (
        <CategoryList menuId={menuId} initialCategories={categories} />
      )}
    </>
  );
}

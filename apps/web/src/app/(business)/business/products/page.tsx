import { EmptyState, PageHeader } from "@qr-platform/ui";
import { Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/config/routes";
import { CategorySelector } from "@/features/product/components/CategorySelector";
import { ProductList } from "@/features/product/components/ProductList";
import { serverFetch } from "@/lib/server-fetch";
import type { Category, Product } from "@/types/catalog";

export const metadata: Metadata = {
  title: "Ürünler — QR Platform",
};

export interface BusinessProductsPageProps {
  searchParams: { categoryId?: string };
}

interface CategoryWithMenuName extends Category {
  menuName: string;
}

export default async function BusinessProductsPage({ searchParams }: BusinessProductsPageProps) {
  // Sprint 8 perf: one call instead of `/menus` + one `/menus/:id/categories`
  // per menu - the API now joins the menu name server-side.
  const categories = (await serverFetch<CategoryWithMenuName[]>("/categories")) ?? [];
  const categoryId = searchParams.categoryId;
  const products = categoryId ? await serverFetch<Product[]>(`/categories/${categoryId}/products`) : null;
  const selectedCategory = categories.find((category) => category.id === categoryId);

  return (
    <>
      <PageHeader title="Ürünler" subtitle="Kategorilerinizdeki ürünleri, variant ve seçenekleri yönetin." />
      <CategorySelector categories={categories} selectedCategoryId={categoryId} />

      {!categoryId ? (
        <EmptyState
          icon={Tag}
          title="Bir kategori seçin"
          description="Ürünleri yönetmek için yukarıdan bir kategori seçin."
        />
      ) : !selectedCategory || products === null ? (
        <EmptyState
          icon={Tag}
          title="Kategori bulunamadı"
          description="Seçilen kategori mevcut değil ya da erişiminiz yok."
          action={
            <Link
              href={ROUTES.businessCategories}
              className="text-sm font-medium text-primary hover:underline"
            >
              Kategorilere dön
            </Link>
          }
        />
      ) : (
        <ProductList categoryId={categoryId} initialProducts={products} />
      )}
    </>
  );
}

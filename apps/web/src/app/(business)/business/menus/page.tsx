import { PageHeader } from "@qr-platform/ui";
import type { Metadata } from "next";

import { MenuList } from "@/features/menu/components/MenuList";
import { serverFetch } from "@/lib/server-fetch";
import type { Menu } from "@/types/catalog";

export const metadata: Metadata = {
  title: "Menüler — QR Platform",
};

export default async function BusinessMenusPage() {
  const menus = (await serverFetch<Menu[]>("/menus")) ?? [];

  return (
    <>
      <PageHeader title="Menüler" subtitle="İşletmenizin dijital menülerini oluşturun ve yönetin." />
      <MenuList initialMenus={menus} />
    </>
  );
}

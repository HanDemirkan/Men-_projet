import { PageHeader } from "@qr-platform/ui";
import type { Metadata } from "next";

import { SearchPanel } from "@/features/search/components/SearchPanel";

export const metadata: Metadata = {
  title: "Arama — QR Platform",
};

export default function BusinessSearchPage() {
  return (
    <>
      <PageHeader title="Arama" subtitle="Ürün, kategori, variant ve seçenekler içinde anlık arama yapın." />
      <SearchPanel />
    </>
  );
}
